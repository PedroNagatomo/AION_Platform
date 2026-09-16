import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch, type SearchResult } from "../../api/search";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Abrir com Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verifica Ctrl+K ou Cmd+K (case-insensitive)
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }

      // ESC para fechar
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    // Adicionar ao document E ao window para garantir captura
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Focus input when open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // No useEffect, adicione também:
  useEffect(() => {
    const handleOpenSearch = () => setIsOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);
    return () =>
      window.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Error searching:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    navigate(result.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      conversation: "text-terminal-accent",
      message: "text-blue-400",
      note: "text-yellow-400",
      contact: "text-orange-400",
      reminder: "text-red-400",
      file: "text-cyan-400",
      spreadsheet: "text-green-400",
      chart: "text-purple-400",
      calendar: "text-pink-400",
    };
    return colors[type] || "text-terminal-accent";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[100] pt-[10vh] px-4">
      <div
        ref={modalRef}
        className="bg-terminal-surface border border-terminal-accent w-full max-w-2xl"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-terminal-border">
          <span className="text-terminal-accent font-mono">❯</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search conversations, notes, files, contacts..."
            className="flex-1 bg-transparent text-terminal-text font-mono text-sm md:text-base focus:outline-none placeholder:text-terminal-dim"
          />
          <kbd className="hidden md:block px-2 py-1 bg-terminal-bg border border-terminal-border text-terminal-dim font-mono text-[10px]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-center font-mono text-sm text-terminal-dim">
              &lt;searching.../&gt;
            </div>
          ) : query.trim() === "" ? (
            <div className="px-4 py-6 text-center font-mono text-sm text-terminal-dim">
              Type to search across all modules...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center font-mono text-sm text-terminal-dim">
              -- no results found --
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    selectedIndex === index
                      ? "bg-terminal-bg border-l-2 border-terminal-accent"
                      : "border-l-2 border-transparent hover:bg-terminal-bg"
                  }`}
                >
                  <span className="text-lg shrink-0">{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs md:text-sm text-terminal-text truncate">
                      {result.title}
                    </div>
                    <div className="font-mono text-[10px] text-terminal-dim truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] shrink-0 ${getTypeColor(result.type)}`}
                  >
                    [{result.type}]
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-terminal-border flex items-center justify-between">
          <span className="font-mono text-[10px] text-terminal-dim">
            {results.length} results
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-terminal-dim hidden md:block">
              ↑↓ Navigate
            </span>
            <span className="font-mono text-[10px] text-terminal-dim hidden md:block">
              ↵ Select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
