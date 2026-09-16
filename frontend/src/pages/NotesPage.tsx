import { useEffect, useState, useRef, type JSX, useCallback } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  renameNote,
  type Note,
} from "../api/notes";
import { exportNoteMarkdown, exportNoteTxt } from "../api/export";
import { useDownload } from "../hooks/useDownload";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useFocusMode } from "../hooks/useFocusMode";
import { useIsMobile } from "../hooks/useMediaQuery";
import { noteTemplates } from "../data/noteTemplates";

const lowlight = createLowlight(common);

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">(
    "edit",
  );
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const { downloadBlob } = useDownload();
  const isMobile = useIsMobile();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedNoteRef = useRef<Note | null>(null);
  const isSwitchingNoteRef = useRef(false);

  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: "Start typing..." }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      // IGNORAR atualizações enquanto estamos trocando de nota
      if (isSwitchingNoteRef.current) {
        return;
      }

      // Usar a ref para pegar a nota ATUAL
      const currentNote = selectedNoteRef.current;

      if (currentNote && !currentNote.isFolder) {
        setSaveStatus("typing...");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          handleSaveContent(editor.getHTML(), currentNote);
        }, 1000);
      }
    },
  });

  useEffect(() => {
    loadNotes();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const handleSelectNote = useCallback(
    (note: Note) => {
      // Cancelar save pendente
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      // Bloquear o onUpdate durante a troca
      isSwitchingNoteRef.current = true;

      setSelectedNote(note);
      setEditTitle(note.title);
      setIsEditingTitle(false);

      if (editor) {
        editor.commands.setContent(note.content || "");
      }

      // Liberar o onUpdate depois do próximo tick
      setTimeout(() => {
        isSwitchingNoteRef.current = false;
      }, 100);
    },
    [editor],
  );

  const handleNewNote = async (isFolder: boolean = false) => {
    const parentId = selectedNote?.isFolder
      ? selectedNote.id
      : selectedNote?.parentId || null;

    try {
      const newNote = await createNote({
        title: isFolder ? "New Folder" : "New Note",
        content: "",
        parentId,
        isFolder,
        icon: isFolder ? "📁" : "📄",
        tags: "",
      });
      setNotes([...notes, newNote]);
      setSelectedNote(newNote);
      setEditTitle(newNote.title);
      setIsEditingTitle(true);
      if (editor) editor.commands.setContent("");
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleSaveContent = useCallback(async (content: string, note: Note) => {
    if (!note || note.isFolder) return;

    setSaveStatus("saving...");
    try {
      const updated = await updateNote(note.id, { content });

      // Atualizar apenas a nota correta
      setNotes((prevNotes) =>
        prevNotes.map((n) => (n.id === updated.id ? updated : n)),
      );

      // Só atualizar selectedNote se ainda for a mesma nota
      if (selectedNoteRef.current?.id === updated.id) {
        setSelectedNote(updated);
      }

      setSaveStatus("saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Error saving:", error);
      setSaveStatus("error");
    }
  }, []);

  const handleRenameNote = async () => {
    if (!selectedNote || !editTitle.trim()) return;
    try {
      const updated = await renameNote(selectedNote.id, editTitle.trim());
      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error renaming:", error);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (window.confirm(`Delete "${note.title}"?`)) {
      try {
        await deleteNote(note.id);
        setNotes(notes.filter((n) => n.id !== note.id));
        if (selectedNote?.id === note.id) {
          setSelectedNote(null);
          if (editor) editor.commands.setContent("");
        }
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const handleExportNoteMarkdown = async () => {
    if (!selectedNote) return;
    try {
      const blob = await exportNoteMarkdown(selectedNote.id);
      downloadBlob(blob, `${selectedNote.title.replace(/\s+/g, "_")}.md`);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting note:", error);
    }
  };

  const handleExportNoteTxt = async () => {
    if (!selectedNote) return;
    try {
      const blob = await exportNoteTxt(selectedNote.id);
      downloadBlob(blob, `${selectedNote.title.replace(/\s+/g, "_")}.txt`);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting note:", error);
    }
  };

  const buildTree = (parentId: string | null): Note[] => {
    return notes.filter((n) => n.parentId === parentId);
  };

  const handleUseTemplate = async (templateId: string) => {
    const template = noteTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const parentId = selectedNote?.isFolder
      ? selectedNote.id
      : selectedNote?.parentId || null;

    try {
      const newNote = await createNote({
        title: template.name,
        content: template.content,
        parentId,
        isFolder: false,
        icon: template.icon,
        tags: "",
      });
      setNotes([...notes, newNote]);
      setSelectedNote(newNote);
      setEditTitle(newNote.title);
      if (editor) editor.commands.setContent(template.content);
      setShowTemplates(false);
    } catch (error) {
      console.error("Error creating note from template:", error);
    }
  };

  const renderNoteTree = (
    parentId: string | null,
    depth: number = 0,
  ): JSX.Element[] => {
    const children = buildTree(parentId);
    return children.map((note) => (
      <div key={note.id} className="group">
        <div
          className={`flex items-center gap-1 px-3 py-2 cursor-pointer transition-colors ${
            selectedNote?.id === note.id
              ? "bg-terminal-bg text-terminal-accent border-l-2 border-terminal-accent"
              : "text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => handleSelectNote(note)}
        >
          <span className="text-xs">
            {note.icon || (note.isFolder ? "📁" : "📄")}
          </span>
          <span className="font-mono text-xs truncate flex-1">
            {note.title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteNote(note);
            }}
            className="text-terminal-dim hover:text-red-500 text-xs px-1"
            title="Delete"
          >
            ✕
          </button>
        </div>
        {note.isFolder && renderNoteTree(note.id, depth + 1)}
      </div>
    ));
  };

  const filteredNotes = searchTerm
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n.content &&
            n.content.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : notes;

  return (
    <div className="flex h-screen">
      {/* Sidebar principal - esconder no mobile */}
      <div className={`${isMobile ? "hidden" : "sidebar-container"}`}>
        <Sidebar />
      </div>

      <div className="flex flex-1 overflow-hidden bg-terminal-bg flex-col md:flex-row">
        {/* Notes Sidebar - esconder no mobile quando nota selecionada */}
        <div
          className={`
            ${isFocusMode ? "hidden" : ""} 
            ${isMobile ? (selectedNote ? "hidden" : "w-full") : "w-64"} 
            border-r border-terminal-border bg-terminal-surface flex flex-col
            ${isMobile ? "h-full" : ""}
          `}
        >
          <div className="p-3 border-b border-terminal-border space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleNewNote(false)}
                className="flex-1 px-2 py-1.5 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-xs hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [+ Note]
              </button>
              <button
                onClick={() => handleNewNote(true)}
                className="flex-1 px-2 py-1.5 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs hover:border-terminal-accent hover:text-terminal-accent transition-colors"
              >
                [+ Folder]
              </button>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1.5 focus:outline-none focus:border-terminal-accent placeholder:text-terminal-dim"
            />
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {filteredNotes.length === 0 ? (
              <div className="px-4 py-2 font-mono text-xs text-terminal-dim">
                -- no notes --
              </div>
            ) : (
              renderNoteTree(null)
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedNote && !selectedNote.isFolder ? (
            <>
              {/* Botão de voltar no mobile */}
              {isMobile && (
                <button
                  onClick={() => setSelectedNote(null)}
                  className="px-3 py-2 bg-terminal-bg border-b border-terminal-border text-terminal-text font-mono text-xs text-left flex items-center gap-2"
                >
                  ← Back to notes
                </button>
              )}

              {/* Header - responsivo */}
              <div className="p-2 md:p-3 border-b border-terminal-border flex items-center gap-2 md:gap-3 flex-wrap">
                {isEditingTitle ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRenameNote}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameNote();
                      if (e.key === "Escape") setIsEditingTitle(false);
                    }}
                    className="flex-1 min-w-[100px] bg-terminal-bg border border-terminal-accent text-terminal-text font-mono text-sm md:text-lg px-2 md:px-3 py-1 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="flex-1 min-w-[100px] font-mono text-sm md:text-lg text-terminal-text cursor-pointer hover:text-terminal-accent transition-colors truncate"
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to rename"
                  >
                    {selectedNote.title}
                  </h1>
                )}

                <span className="font-mono text-[10px] md:text-xs text-terminal-dim hidden md:inline">
                  {saveStatus}
                </span>

                {/* Botões de visualização - esconder split no mobile */}
                <div className="flex gap-1">
                  {[
                    { id: "edit", label: "✏️", title: "Edit" },
                    { id: "preview", label: "👁", title: "Preview" },
                    ...(isMobile
                      ? []
                      : [{ id: "split", label: "⬌", title: "Split" }]),
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id as any)}
                      className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors ${
                        viewMode === mode.id
                          ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                          : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                      }`}
                      title={mode.title}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Export button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent transition-colors"
                    title="Export note"
                  >
                    📤
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-terminal-surface border border-terminal-border z-50 min-w-[160px] md:min-w-[180px]">
                      <button
                        onClick={handleExportNoteMarkdown}
                        className="block w-full text-left px-3 md:px-4 py-2 font-mono text-[10px] md:text-xs text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent"
                      >
                        [ Markdown ]
                      </button>
                      <button
                        onClick={handleExportNoteTxt}
                        className="block w-full text-left px-3 md:px-4 py-2 font-mono text-[10px] md:text-xs text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent"
                      >
                        [ TXT ]
                      </button>
                    </div>
                  )}
                </div>

                {/* Focus mode - esconder no mobile */}
                <button
                  onClick={toggleFocusMode}
                  className={`hidden md:block px-2 py-1 font-mono text-xs border transition-colors ${
                    isFocusMode
                      ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                      : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                  }`}
                  title={isFocusMode ? "Exit Focus Mode (Esc)" : "Focus Mode"}
                >
                  {isFocusMode ? "⊡" : "⛶"}
                </button>

                {/* Templates button */}
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent transition-colors"
                  title="Templates"
                >
                  📋
                </button>
              </div>

              {/* Toolbar - scrollável no mobile */}
              {viewMode !== "preview" && editor && (
                <div className="flex flex-wrap items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 border-b border-terminal-border bg-terminal-surface overflow-x-auto">
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors shrink-0 ${
                      editor.isActive("heading", { level: 1 })
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    H1
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors shrink-0 ${
                      editor.isActive("heading", { level: 2 })
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    H2
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors shrink-0 ${
                      editor.isActive("heading", { level: 3 })
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    H3
                  </button>

                  <div className="w-px h-5 bg-terminal-border mx-0.5 shrink-0" />

                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs font-bold border transition-colors shrink-0 ${
                      editor.isActive("bold")
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs italic border transition-colors shrink-0 ${
                      editor.isActive("italic")
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    I
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs line-through border transition-colors shrink-0 ${
                      editor.isActive("strike")
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    S
                  </button>

                  <div className="w-px h-5 bg-terminal-border mx-0.5 shrink-0" />

                  <button
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors shrink-0 ${
                      editor.isActive("bulletList")
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    •
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors shrink-0 ${
                      editor.isActive("orderedList")
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    1.
                  </button>

                  <div className="w-px h-5 bg-terminal-border mx-0.5 shrink-0" />

                  <button
                    onClick={() =>
                      editor.chain().focus().toggleCodeBlock().run()
                    }
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors shrink-0 ${
                      editor.isActive("codeBlock")
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    &lt;/&gt;
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleBlockquote().run()
                    }
                    className={`px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border transition-colors shrink-0 ${
                      editor.isActive("blockquote")
                        ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                        : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    ❝
                  </button>

                  <div className="w-px h-5 bg-terminal-border mx-0.5 shrink-0" />

                  <button
                    onClick={() => editor.chain().focus().undo().run()}
                    className="px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent shrink-0"
                  >
                    ↶
                  </button>
                  <button
                    onClick={() => editor.chain().focus().redo().run()}
                    className="px-1.5 md:px-2 py-1 font-mono text-[10px] md:text-xs border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent shrink-0"
                  >
                    ↷
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {viewMode === "edit" && (
                  <EditorContent
                    editor={editor}
                    className="tiptap-editor min-h-full px-3 md:px-6 py-2 md:py-4"
                  />
                )}
                {viewMode === "preview" && (
                  <div
                    className="tiptap-preview px-3 md:px-6 py-2 md:py-4 font-mono text-sm text-terminal-text"
                    dangerouslySetInnerHTML={{
                      __html: editor?.getHTML() || "",
                    }}
                  />
                )}
                {viewMode === "split" && !isMobile && (
                  <div className="flex h-full">
                    <div className="flex-1 border-r border-terminal-border overflow-y-auto">
                      <EditorContent
                        editor={editor}
                        className="tiptap-editor"
                      />
                    </div>
                    <div
                      className="flex-1 px-6 py-4 font-mono text-sm text-terminal-text overflow-y-auto"
                      dangerouslySetInnerHTML={{
                        __html: editor?.getHTML() || "",
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : selectedNote?.isFolder ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-4xl mb-4">📁</div>
                <div className="font-mono text-terminal-dim text-sm">
                  &lt;folder: {selectedNote.title}/&gt;
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="font-mono text-4xl text-terminal-dim mb-4">
                  📝
                </div>
                <div className="font-mono text-terminal-dim text-sm">
                  &lt;select_or_create_a_note/&gt;
                </div>
                <button
                  onClick={() => handleNewNote(false)}
                  className="mt-4 px-4 py-2 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
                >
                  [+ Create Note]
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal - responsivo */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-4">
              &lt;templates/&gt;
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              {noteTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleUseTemplate(template.id)}
                  className="p-3 md:p-4 bg-terminal-bg border border-terminal-border text-left hover:border-terminal-accent transition-colors"
                >
                  <div className="text-xl md:text-2xl mb-1 md:mb-2">
                    {template.icon}
                  </div>
                  <div className="font-mono text-xs md:text-sm text-terminal-text">
                    {template.name}
                  </div>
                  <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm hover:border-terminal-accent transition-colors"
              >
                [ Cancel ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
