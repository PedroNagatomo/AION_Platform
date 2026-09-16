import {
  useEffect,
  useState,
  useRef,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { TerminalButton } from "../components/ui/TerminalButton";
import {
  getFiles,
  getFolders,
  uploadFiles,
  toggleFavorite,
  deleteFile,
  type UserFile,
} from "../api/files";
import { useIsMobile } from "../hooks/useMediaQuery";

export function FilesPage() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [showFoldersMobile, setShowFoldersMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadFiles();
    loadFolders();
  }, [currentFolder]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const data = await getFiles(currentFolder);
      setFiles(data);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  const handleUpload = async (fileList: File[]) => {
    if (fileList.length === 0) return;

    setIsLoading(true);
    try {
      const uploaded = await uploadFiles(fileList, currentFolder);
      setFiles([...uploaded, ...files]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleUpload(selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleUpload(droppedFiles);
  };

  const handleToggleFavorite = async (file: UserFile) => {
    try {
      await toggleFavorite(file.id);
      setFiles(
        files.map((f) =>
          f.id === file.id ? { ...f, isFavorite: !f.isFavorite } : f,
        ),
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDelete = async (file: UserFile) => {
    if (window.confirm(`Delete "${file.fileName}"?`)) {
      try {
        await deleteFile(file.id);
        setFiles(files.filter((f) => f.id !== file.id));
        if (selectedFile?.id === file.id) setSelectedFile(null);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("pdf")) return "📕";
    if (fileType.includes("text") || fileType.includes("markdown")) return "📄";
    if (fileType.includes("json")) return "📋";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("video")) return "🎬";
    return "📁";
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden bg-terminal-bg flex-col md:flex-row relative">
        {/* MOBILE: Botão para mostrar pastas */}
        {isMobile && (
          <button
            onClick={() => setShowFoldersMobile(!showFoldersMobile)}
            className="md:hidden px-4 py-2 bg-terminal-surface border-b border-terminal-border text-terminal-text font-mono text-sm flex items-center gap-2"
          >
            📁 Folders {showFoldersMobile ? "▲" : "▼"}
          </button>
        )}

        {/* MOBILE: Dropdown de pastas */}
        {isMobile && showFoldersMobile && (
          <div className="md:hidden absolute top-10 left-0 right-0 z-40 bg-terminal-surface border-b border-terminal-border max-h-60 overflow-y-auto">
            <div className="p-3 space-y-1">
              <button
                onClick={() => {
                  setCurrentFolder(undefined);
                  setShowFoldersMobile(false);
                }}
                className={`w-full text-left px-3 py-2 font-mono text-xs transition-colors ${
                  currentFolder === undefined
                    ? "bg-terminal-bg text-terminal-accent"
                    : "text-terminal-text hover:bg-terminal-bg"
                }`}
              >
                📁 All Files
              </button>
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => {
                    setCurrentFolder(folder);
                    setShowFoldersMobile(false);
                  }}
                  className={`w-full text-left px-3 py-2 font-mono text-xs transition-colors ${
                    currentFolder === folder
                      ? "bg-terminal-bg text-terminal-accent"
                      : "text-terminal-text hover:bg-terminal-bg"
                  }`}
                >
                  📁 {folder}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DESKTOP: Sidebar de pastas */}
        <div className="hidden md:flex w-48 border-r border-terminal-border bg-terminal-surface flex-col shrink-0">
          <div className="p-3 border-b border-terminal-border">
            <div className="font-mono text-xs text-terminal-dim mb-2">
              &lt;folders&gt;
            </div>
            <button
              onClick={() => setCurrentFolder(undefined)}
              className={`w-full text-left px-2 py-1.5 font-mono text-xs transition-colors ${
                currentFolder === undefined
                  ? "bg-terminal-bg text-terminal-accent"
                  : "text-terminal-text hover:bg-terminal-bg"
              }`}
            >
              📁 All Files
            </button>
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setCurrentFolder(folder)}
                className={`w-full text-left px-2 py-1.5 font-mono text-xs transition-colors ${
                  currentFolder === folder
                    ? "bg-terminal-bg text-terminal-accent"
                    : "text-terminal-text hover:bg-terminal-bg"
                }`}
              >
                📁 {folder}
              </button>
            ))}
          </div>
        </div>

        {/* Área principal */}
        <div
          className={`flex-1 flex flex-col ${isDragging ? "bg-terminal-accent bg-opacity-5" : ""} min-w-0`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="p-3 md:p-4 border-b border-terminal-border flex items-center justify-between flex-wrap gap-2">
            <h1 className="font-mono text-lg md:text-xl text-terminal-accent">
              ❯ Files
            </h1>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [+ Upload]
              </button>
            </div>
          </div>

          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-terminal-bg bg-opacity-80 z-30 pointer-events-none">
              <div className="font-mono text-terminal-accent text-base md:text-lg border-2 border-dashed border-terminal-accent px-6 md:px-8 py-3 md:py-4">
                Drop files here
              </div>
            </div>
          )}

          {/* Files Grid */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            {isLoading ? (
              <div className="font-mono text-sm text-terminal-dim">
                Loading...
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="font-mono text-3xl md:text-4xl text-terminal-dim mb-4">
                  📂
                </div>
                <div className="font-mono text-terminal-dim text-sm">
                  &lt;no_files/&gt;
                </div>
                <div className="font-mono text-terminal-dim text-xs mt-2 text-center px-4">
                  Drag & drop files here or click Upload
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`p-2.5 md:p-4 bg-terminal-surface border cursor-pointer transition-colors ${
                      selectedFile?.id === file.id
                        ? "border-terminal-accent"
                        : "border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    {/* Thumbnail ou ícone */}
                    <div className="h-16 md:h-24 flex items-center justify-center mb-2 md:mb-3">
                      {file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.fileName}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl md:text-4xl">
                          {getFileIcon(file.fileType)}
                        </span>
                      )}
                    </div>

                    {/* Nome */}
                    <div className="font-mono text-[10px] md:text-xs text-terminal-text truncate mb-1">
                      {file.fileName}
                    </div>

                    {/* Tamanho */}
                    <div className="font-mono text-[9px] md:text-[10px] text-terminal-dim">
                      {formatFileSize(file.fileSize)}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(file);
                        }}
                        className={`text-xs md:text-sm ${file.isFavorite ? "text-yellow-500" : "text-terminal-dim hover:text-yellow-500"}`}
                      >
                        {file.isFavorite ? "★" : "☆"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        className="text-[10px] md:text-xs text-terminal-dim hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE: Preview overlay */}
        {isMobile && selectedFile && selectedFile.thumbnail && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFile(null)}
          >
            <div
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedFile.thumbnail}
                alt={selectedFile.fileName}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="font-mono text-xs text-terminal-text mt-2 text-center truncate">
                {selectedFile.fileName}
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="mt-3 w-full px-4 py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-sm"
              >
                [ Close ]
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP: Preview panel */}
        {!isMobile && selectedFile && selectedFile.thumbnail && (
          <div className="w-72 border-l border-terminal-border bg-terminal-surface p-4 shrink-0 hidden lg:block">
            <div className="font-mono text-xs text-terminal-accent mb-2">
              &lt;preview&gt;
            </div>
            <img
              src={selectedFile.thumbnail}
              alt={selectedFile.fileName}
              className="w-full object-contain"
            />
            <div className="font-mono text-xs text-terminal-text mt-2 truncate">
              {selectedFile.fileName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
