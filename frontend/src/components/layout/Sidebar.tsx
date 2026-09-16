import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useConversationStore } from "../../store/conversationStore";
import {
  getConversations,
  createConversation,
  endConversation,
  updateConversationTitle,
  deleteConversation,
  deleteAllConversations,
  togglePin,
} from "../../api/conversation";
import { useTokenMonitor } from "../../hooks/useTokenMonitor";
import { useIsMobile } from "../../hooks/useMediaQuery";
import type { Conversation } from "../../types";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  module: string;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: "⌂", module: "dashboard" },
  { path: "/chat", label: "AI Chat", icon: "❯", module: "chat" },
  { path: "/workflows", label: "Workflows", icon: "⚡", module: "workflows" },

  { path: "/notes", label: "Notes", icon: "📝", module: "notes" },
  { path: "/files", label: "Files", icon: "📁", module: "files" },
  {
    path: "/spreadsheets",
    label: "Spreadsheets",
    icon: "▦",
    module: "spreadsheets",
  },
  { path: "/charts", label: "Charts", icon: "📊", module: "charts" },
  {
    path: "/whiteboard",
    label: "Whiteboard",
    icon: "🎨",
    module: "whiteboard",
  },
  { path: "/calendar", label: "Calendar", icon: "📅", module: "calendar" },
  { path: "/reminders", label: "Reminders", icon: "⏰", module: "reminders" },
  { path: "/contacts", label: "Contacts", icon: "👤", module: "contacts" },
  {
    path: "/integrations",
    label: "Integrations",
    icon: "🔗",
    module: "integrations",
  },

  { path: "/settings", label: "Settings", icon: "⚙", module: "settings" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    setMessages,
  } = useConversationStore();

  const { tokenUsage, tokenLimit, usagePercentage, warningLevel } =
    useTokenMonitor();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      loadConversations();
    }
    setIsMobileOpen(false);
  }, [location.pathname]);

  const loadConversations = async () => {
    try {
      const convs = await getConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation();
      setConversations([newConv, ...conversations]);
      setCurrentConversation(newConv);
      setMessages([]);
      navigate(`/chat/${newConv.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleEndConversation = async () => {
    if (currentConversation) {
      try {
        await endConversation(currentConversation.id);
        const convs = await getConversations();
        setConversations(convs);
        setCurrentConversation(null);
        setMessages([]);
        navigate("/chat");
      } catch (error) {
        console.error("Error ending conversation:", error);
      }
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    navigate(`/chat/${conversation.id}`);
  };

  const handleStartEditTitle = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || "");
  };

  const handleSaveTitle = async (conversationId: string) => {
    if (editTitle.trim()) {
      try {
        const updated = await updateConversationTitle(
          conversationId,
          editTitle.trim(),
        );
        setConversations(
          conversations.map((c) => (c.id === conversationId ? updated : c)),
        );
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updated);
        }
      } catch (error) {
        console.error("Error renaming conversation:", error);
      }
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle(conversationId);
    }
    if (e.key === "Escape") {
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleTogglePin = async (conversationId: string) => {
    try {
      const updated = await togglePin(conversationId);
      setConversations(
        conversations.map((c) => (c.id === conversationId ? updated : c)),
      );
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updated);
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation(conversationId);
        setConversations(conversations.filter((c) => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
          navigate("/chat");
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
      }
    }
  };

  const handleDeleteAllConversations = async () => {
    if (window.confirm("Are you sure you want to delete ALL conversations?")) {
      try {
        await deleteAllConversations();
        setConversations([]);
        setCurrentConversation(null);
        setMessages([]);
        navigate("/chat");
        setShowDeleteAllConfirm(false);
      } catch (error) {
        console.error("Error deleting all conversations:", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Função para abrir a busca global (Ctrl+K)
  const handleOpenSearch = () => {
    // Disparar evento custom que o GlobalSearch escuta
    window.dispatchEvent(new CustomEvent("open-global-search"));
  };

  const isModuleActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const warningStyles = {
    none: {
      border: "border-transparent",
      text: "text-terminal-dim",
      bar: "bg-terminal-accent",
    },
    warning: {
      border: "border-yellow-500",
      text: "text-yellow-500",
      bar: "bg-yellow-500",
    },
    critical: {
      border: "border-orange-500",
      text: "text-orange-500",
      bar: "bg-orange-500",
    },
    danger: {
      border: "border-red-500",
      text: "text-red-500",
      bar: "bg-red-500",
    },
  }[warningLevel] as { border: string; text: string; bar: string };

  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // MOBILE: Hamburger menu button
  if (isMobile && !isMobileOpen) {
    return (
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-terminal-surface border border-terminal-accent text-terminal-accent flex items-center justify-center text-xl rounded"
        title="Open menu"
      >
        ☰
      </button>
    );
  }

  // MOBILE: Overlay quando aberto
  if (isMobile && isMobileOpen) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
        <div className="fixed left-0 top-0 h-full w-72 z-50 bg-terminal-surface border-r border-terminal-border flex flex-col">
          {renderSidebarContent()}
        </div>
      </>
    );
  }

  // DESKTOP: Sidebar normal ou colapsada
  return (
    <div
      className={`${isCollapsed ? "w-14" : "w-64"} h-screen bg-terminal-surface border-r border-terminal-border flex flex-col transition-all duration-300`}
    >
      {isCollapsed ? renderCollapsedContent() : renderSidebarContent()}
    </div>
  );

  function renderCollapsedContent() {
    return (
      <>
        <div className="p-3 border-b border-terminal-border flex flex-col items-center gap-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-terminal-accent text-lg"
            title="Expand"
          >
            →
          </button>
          {/* Search button collapsed */}
          <button
            onClick={handleOpenSearch}
            className="text-terminal-dim hover:text-terminal-accent text-sm"
            title="Search (Ctrl+K)"
          >
            🔍
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full p-2 flex items-center justify-center transition-colors ${
                isModuleActive(item.path)
                  ? "bg-terminal-bg text-terminal-accent"
                  : "text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent"
              }`}
              title={item.label}
            >
              <span className="text-lg">{item.icon}</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-terminal-border flex justify-center">
          <button
            onClick={handleLogout}
            className="text-terminal-error text-lg"
            title="Logout"
          >
            ⎋
          </button>
        </div>
      </>
    );
  }

  function renderSidebarContent() {
    return (
      <>
        {/* Header */}
        <div className="p-4 border-b border-terminal-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-terminal-accent">❯</span>
              <span className="font-mono text-sm text-terminal-text">
                AION All in One
              </span>
            </div>
            <div className="mt-1 font-mono text-xs text-terminal-dim">
              {user?.email}
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-terminal-dim hover:text-terminal-accent text-sm"
              title="Collapse"
            >
              ←
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="text-terminal-dim hover:text-red-500 text-sm"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Button */}
        <div className="px-3 py-2 border-b border-terminal-border">
          <button
            onClick={handleOpenSearch}
            className="w-full flex items-center gap-2 px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-dim font-mono text-xs hover:border-terminal-accent hover:text-terminal-accent transition-colors"
          >
            <span>🔍</span>
            <span className="flex-1 text-left">Search...</span>
            <kbd className="px-1.5 py-0.5 bg-terminal-surface border border-terminal-border text-[10px] font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-3 py-2 font-mono text-sm transition-colors flex items-center gap-2 ${
                  isModuleActive(item.path)
                    ? "bg-terminal-bg text-terminal-accent border-l-2 border-terminal-accent"
                    : "text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent border-l-2 border-transparent"
                }`}
              >
                <span className="text-terminal-accent">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Conversations */}
          {isModuleActive("/chat") && (
            <>
              <div className="px-3 py-2 space-y-2">
                <button
                  onClick={handleNewConversation}
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
                >
                  [ + New Chat ]
                </button>

                {currentConversation && (
                  <button
                    onClick={handleEndConversation}
                    className={`w-full px-3 py-2 bg-terminal-bg border font-mono text-sm transition-colors ${
                      warningLevel === "danger" || warningLevel === "critical"
                        ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-terminal-bg animate-pulse"
                        : "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-terminal-bg"
                    }`}
                  >
                    [ End & Save ]
                  </button>
                )}

                {currentConversation && (
                  <div
                    className={`px-3 py-2 bg-terminal-bg border ${warningStyles.border} rounded`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-mono text-[10px] ${warningStyles.text}`}
                      >
                        {warningLevel === "danger"
                          ? "🔴 LIMIT"
                          : warningLevel === "critical"
                            ? "⚡ CRITICAL"
                            : warningLevel === "warning"
                              ? "⚠ WARNING"
                              : "📊 TOKENS"}
                      </span>
                      <span
                        className={`font-mono text-[10px] ${warningStyles.text}`}
                      >
                        {usagePercentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-terminal-border overflow-hidden rounded">
                      <div
                        className={`h-full ${warningStyles.bar}`}
                        style={{
                          width: `${Math.min(Number(usagePercentage), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 font-mono text-xs text-terminal-dim flex items-center justify-between">
                <span>&lt;conversations&gt;</span>
                {conversations.length > 0 && (
                  <button
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="text-terminal-error hover:text-red-400 text-[10px]"
                  >
                    [clear]
                  </button>
                )}
              </div>

              {showDeleteAllConfirm && (
                <div className="px-3 py-2 mb-2 bg-terminal-bg border border-red-500">
                  <div className="font-mono text-xs text-red-500 mb-2">
                    Delete ALL?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAllConversations}
                      className="px-2 py-1 bg-red-500 text-terminal-bg font-mono text-xs"
                    >
                      [ Yes ]
                    </button>
                    <button
                      onClick={() => setShowDeleteAllConfirm(false)}
                      className="px-2 py-1 border border-terminal-border text-terminal-dim font-mono text-xs"
                    >
                      [ No ]
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {sortedConversations.length === 0 ? (
                  <div className="px-4 py-2 font-mono text-xs text-terminal-dim">
                    -- no conversations --
                  </div>
                ) : (
                  sortedConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative ${
                        currentConversation?.id === conv.id
                          ? "bg-terminal-bg border-l-2 border-terminal-accent"
                          : "border-l-2 border-transparent"
                      } ${conv.pinned ? "bg-terminal-bg bg-opacity-50" : ""}`}
                    >
                      {editingId === conv.id ? (
                        <div className="px-4 py-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, conv.id)}
                            onBlur={() => handleSaveTitle(conv.id)}
                            className="w-full bg-terminal-bg border border-terminal-accent text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(conv.id);
                            }}
                            className={`text-xs px-1 shrink-0 ${conv.pinned ? "text-yellow-500" : "text-terminal-dim hover:text-yellow-500 opacity-0 group-hover:opacity-100"}`}
                          >
                            {conv.pinned ? "★" : "☆"}
                          </button>
                          <button
                            onClick={() => handleSelectConversation(conv)}
                            className={`flex-1 text-left px-2 py-2 font-mono text-xs transition-colors ${
                              currentConversation?.id === conv.id
                                ? "text-terminal-accent"
                                : "text-terminal-text hover:text-terminal-accent"
                            }`}
                          >
                            <div className="truncate">
                              {conv.title || "Untitled"}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                            <button
                              onClick={() => handleStartEditTitle(conv)}
                              className="text-terminal-dim hover:text-terminal-accent text-xs px-1"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDeleteConversation(conv.id)}
                              className="text-terminal-dim hover:text-red-500 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-terminal-border">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 bg-terminal-bg border border-terminal-error text-terminal-error font-mono text-sm hover:bg-terminal-error hover:text-terminal-bg transition-colors"
          >
            [ Logout ]
          </button>
        </div>
      </>
    );
  }
}
