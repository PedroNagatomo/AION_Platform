import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  testGitHubConnection,
  testNotionConnection,
  searchNotionPages,
  searchNotionDatabases,
  getGitHubOAuthUrl,
  getGitHubRepositories,
  type IntegrationInfo,
} from "../api/integrations";
import api from "../utils/api";

interface IntegrationConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  instructions: string;
  tokenPlaceholder: string;
  needsRefreshToken?: boolean;
  supportsOAuth?: boolean;
}

const integrationConfigs: IntegrationConfig[] = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    icon: "📅",
    description: "Sync events with Google Calendar",
    category: "Productivity",
    instructions: "Or paste token manually if OAuth is not available.",
    tokenPlaceholder: "Paste Google OAuth2 Access Token",
    needsRefreshToken: true,
    supportsOAuth: true,
  },
  {
    id: "google_drive",
    name: "Google Drive",
    icon: "☁️",
    description: "Access files from Google Drive",
    category: "Storage",
    instructions: "Or paste token manually if OAuth is not available.",
    tokenPlaceholder: "Paste Google OAuth2 Access Token",
    needsRefreshToken: true,
    supportsOAuth: true,
  },
  {
    id: "notion",
    name: "Notion",
    icon: "📝",
    description: "Sync notes with Notion",
    category: "Productivity",
    instructions: "Connect your Notion workspace using OAuth.",
    tokenPlaceholder: "Paste Notion Integration Token (secret_... or ntn_...)",
    supportsOAuth: true,
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    description: "Connect repositories and manage code",
    category: "Development",
    instructions:
      "Connect your GitHub account using OAuth or paste a Personal Access Token.",
    tokenPlaceholder: "Paste GitHub Personal Access Token (ghp_...)",
    supportsOAuth: true,
  },
];

export function IntegrationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);

  // Notion state
  const [notionUser, setNotionUser] = useState<any>(null);
  const [notionPages, setNotionPages] = useState<any[]>([]);
  const [notionDatabases, setNotionDatabases] = useState<any[]>([]);
  const [showNotionBrowser, setShowNotionBrowser] = useState(false);
  const [notionSearchQuery, setNotionSearchQuery] = useState("");
  const [isLoadingNotion, setIsLoadingNotion] = useState(false);

  // GitHub state
  const [githubUser, setGithubUser] = useState<any>(null);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);

  useEffect(() => {
    loadIntegrations();

    // Verificar callback OAuth
    const params = new URLSearchParams(location.search);
    const connectedProvider = params.get("connected");
    if (connectedProvider) {
      setSuccessMessage(`${connectedProvider} connected successfully!`);
      setTimeout(() => setSuccessMessage(""), 5000);
      navigate("/integrations", { replace: true });
    }
  }, []);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const data = await getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotionData = async () => {
    setIsLoadingNotion(true);
    try {
      const [pages, databases] = await Promise.all([
        searchNotionPages(),
        searchNotionDatabases(),
      ]);
      setNotionPages(pages);
      setNotionDatabases(databases);
    } catch (error) {
      console.error("Error loading Notion data:", error);
      setErrorMessage("Error loading Notion data. Check your token.");
    } finally {
      setIsLoadingNotion(false);
    }
  };

  const loadGitHubRepos = async () => {
    setIsLoadingGitHub(true);
    try {
      const repos = await getGitHubRepositories();
      setGithubRepos(repos);
      setShowGitHubRepos(true);
    } catch (error) {
      console.error("Error loading GitHub repos:", error);
      setErrorMessage("Error loading GitHub repositories.");
    } finally {
      setIsLoadingGitHub(false);
    }
  };

  const handleConnectWithOAuth = async (provider: string) => {
    setConnectingProvider(provider);
    setIsOAuthRedirecting(true);
    setErrorMessage("");

    try {
      if (provider === "notion") {
        const response = await api.get("/integrations/notion/oauth-url");
        const { url } = response.data;
        window.location.href = url;
      } else if (provider === "github") {
        const oauthUrl = await getGitHubOAuthUrl();
        window.location.href = oauthUrl;
      } else {
        // Para Google e outros (futuro)
        const response = await api.get(`/integrations/${provider}/oauth/start`);
        const { authUrl } = response.data;
        window.location.href = authUrl;
      }
    } catch (error: any) {
      console.error("Error starting OAuth:", error);
      setErrorMessage("Error starting OAuth flow. Please try token manually.");
      setConnectingProvider(null);
      setIsOAuthRedirecting(false);
    }
  };

  const handleConnectWithToken = async (provider: string) => {
    if (!accessToken.trim()) {
      setErrorMessage("Access token is required");
      return;
    }

    setConnectingProvider(provider);
    setErrorMessage("");

    try {
      if (provider === "github") {
        try {
          const githubData = await testGitHubConnection(accessToken.trim());
          setGithubUser(githubData);
        } catch (error) {
          setErrorMessage("Invalid GitHub token. Please check and try again.");
          setConnectingProvider(null);
          return;
        }
      } else if (provider === "notion") {
        try {
          const notionData = await testNotionConnection(accessToken.trim());
          setNotionUser(notionData);
        } catch (error) {
          setErrorMessage("Invalid Notion token. Please check and try again.");
          setConnectingProvider(null);
          return;
        }
      }

      await connectIntegration(
        provider,
        accessToken.trim(),
        refreshToken.trim() || undefined,
      );

      setSuccessMessage(
        `${integrationConfigs.find((i) => i.id === provider)?.name} connected successfully!`,
      );
      setShowConnectModal(null);
      setAccessToken("");
      setRefreshToken("");
      setGithubUser(null);
      setNotionUser(null);

      setTimeout(() => setSuccessMessage(""), 5000);
      loadIntegrations();
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "Error connecting integration",
      );
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (
      window.confirm(
        `Disconnect ${integrationConfigs.find((i) => i.id === provider)?.name}?`,
      )
    ) {
      try {
        await disconnectIntegration(provider);
        setSuccessMessage("Integration disconnected");
        setTimeout(() => setSuccessMessage(""), 3000);
        if (provider === "notion") {
          setNotionPages([]);
          setNotionDatabases([]);
          setNotionUser(null);
        }
        if (provider === "github") {
          setGithubRepos([]);
          setGithubUser(null);
        }
        loadIntegrations();
      } catch (error) {
        console.error("Error disconnecting:", error);
        setErrorMessage("Error disconnecting integration");
      }
    }
  };

  const getIntegrationConfig = (provider: string) => {
    return integrationConfigs.find((i) => i.id === provider);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-3 md:p-4 lg:p-8 max-w-4xl">
          {/* Header */}
          <div className="mb-4 md:mb-8">
            <h1 className="font-mono text-lg md:text-2xl text-terminal-accent mb-2">
              ❯ Integrations
            </h1>
            <p className="font-mono text-xs md:text-sm text-terminal-dim">
              &lt;connect_external_services/&gt;
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500">
              <span className="font-mono text-xs md:text-sm text-red-500">
                ❌ {errorMessage}
              </span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-terminal-accent bg-opacity-10 border border-terminal-accent">
              <span className="font-mono text-xs md:text-sm text-terminal-accent">
                ✅ {successMessage}
              </span>
            </div>
          )}

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {integrationConfigs.map((config) => {
              const integration = integrations.find(
                (i) => i.provider === config.id,
              );
              const isConnected = integration?.connected || false;

              return (
                <div
                  key={config.id}
                  className={`p-4 md:p-6 border transition-colors ${
                    isConnected
                      ? "bg-terminal-surface border-terminal-accent"
                      : "bg-terminal-surface border-terminal-border hover:border-terminal-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl md:text-3xl">{config.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="font-mono text-sm md:text-base text-terminal-text">
                          {config.name}
                        </h3>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 border ${
                            isConnected
                              ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                              : "bg-terminal-bg text-terminal-dim border-terminal-border"
                          }`}
                        >
                          {isConnected ? "[ Connected ]" : "[ Not Connected ]"}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] md:text-xs text-terminal-dim mt-2">
                        {config.description}
                      </p>
                      <div className="font-mono text-[10px] text-terminal-dim mt-1">
                        Category: {config.category}
                      </div>

                      {/* Notion user info */}
                      {isConnected && config.id === "notion" && notionUser && (
                        <div className="mt-2 font-mono text-xs text-terminal-accent">
                          ✓ {notionUser.name}
                        </div>
                      )}

                      {/* GitHub user info */}
                      {isConnected && config.id === "github" && githubUser && (
                        <div className="mt-2 flex items-center gap-2">
                          <img
                            src={githubUser.avatarUrl}
                            alt={githubUser.login}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="font-mono text-xs text-terminal-accent">
                            @{githubUser.login}
                          </span>
                        </div>
                      )}

                      {/* Botões de ação */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {isConnected ? (
                          <>
                            {config.id === "notion" && (
                              <button
                                onClick={() => {
                                  setShowNotionBrowser(true);
                                  loadNotionData();
                                }}
                                className="px-3 py-1.5 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-[10px] md:text-xs hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
                              >
                                [ Browse Notion ]
                              </button>
                            )}
                            {config.id === "github" && (
                              <button
                                onClick={loadGitHubRepos}
                                className="px-3 py-1.5 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-[10px] md:text-xs hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
                              >
                                [ Browse Repos ]
                              </button>
                            )}
                            <button
                              onClick={() => handleDisconnect(config.id)}
                              className="px-3 py-1.5 bg-terminal-bg border border-red-500 text-red-500 font-mono text-[10px] md:text-xs hover:bg-red-500 hover:text-terminal-bg transition-colors"
                            >
                              [ Disconnect ]
                            </button>
                          </>
                        ) : (
                          <>
                            {config.supportsOAuth && (
                              <button
                                onClick={() =>
                                  handleConnectWithOAuth(config.id)
                                }
                                disabled={connectingProvider === config.id}
                                className="px-3 py-1.5 bg-terminal-accent text-terminal-bg font-mono text-[10px] md:text-xs hover:opacity-80 transition-colors disabled:opacity-50"
                              >
                                {connectingProvider === config.id &&
                                isOAuthRedirecting
                                  ? "[ Redirecting... ]"
                                  : config.id === "notion"
                                    ? "[ Connect with Notion ]"
                                    : config.id === "github"
                                      ? "[ Connect with GitHub ]"
                                      : `[ Connect ]`}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowConnectModal(config.id);
                                setErrorMessage("");
                                setAccessToken("");
                                setRefreshToken("");
                              }}
                              className="px-3 py-1.5 bg-terminal-bg border border-terminal-border text-terminal-dim font-mono text-[10px] md:text-xs hover:border-terminal-accent hover:text-terminal-accent transition-colors"
                              title="Connect with token manually"
                            >
                              [ Token ]
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal para token manual */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-md">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-3">
              &lt;connect_{getIntegrationConfig(showConnectModal)?.id}/&gt;
            </h3>

            <div className="mb-4 p-3 bg-terminal-bg border border-terminal-border">
              <p className="font-mono text-[10px] md:text-xs text-terminal-dim leading-relaxed">
                {getIntegrationConfig(showConnectModal)?.instructions}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1 block">
                  Access Token:
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder={
                    getIntegrationConfig(showConnectModal)?.tokenPlaceholder
                  }
                  className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-3 py-2 focus:outline-none focus:border-terminal-accent"
                />
              </div>

              {getIntegrationConfig(showConnectModal)?.needsRefreshToken && (
                <div>
                  <label className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1 block">
                    Refresh Token (optional):
                  </label>
                  <input
                    type="password"
                    value={refreshToken}
                    onChange={(e) => setRefreshToken(e.target.value)}
                    placeholder="Paste refresh token"
                    className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-3 py-2 focus:outline-none focus:border-terminal-accent"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleConnectWithToken(showConnectModal)}
                  disabled={connectingProvider === showConnectModal}
                  className="px-4 py-2 bg-terminal-accent text-terminal-bg font-mono text-xs md:text-sm disabled:opacity-50"
                >
                  {connectingProvider === showConnectModal
                    ? "[ Connecting... ]"
                    : "[ Connect ]"}
                </button>
                <button
                  onClick={() => setShowConnectModal(null)}
                  className="px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm"
                >
                  [ Cancel ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notion Browser Modal */}
      {showNotionBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-3">
              &lt;notion_browser/&gt;
            </h3>

            <input
              value={notionSearchQuery}
              onChange={(e) => {
                setNotionSearchQuery(e.target.value);
                searchNotionPages(e.target.value)
                  .then(setNotionPages)
                  .catch(console.error);
              }}
              placeholder="Search Notion pages..."
              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-3 py-2 mb-3 focus:outline-none focus:border-terminal-accent"
            />

            <div className="flex-1 overflow-y-auto space-y-3">
              {notionDatabases.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1">
                    Databases ({notionDatabases.length}):
                  </div>
                  {notionDatabases.map((db) => (
                    <div
                      key={db.id}
                      className="flex items-center gap-2 px-3 py-2 bg-terminal-bg border border-terminal-border mb-1"
                    >
                      <span>🗄️</span>
                      <span className="font-mono text-xs text-terminal-text truncate flex-1">
                        {db.title}
                      </span>
                      <a
                        href={db.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-accent text-xs shrink-0"
                      >
                        ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1">
                  Pages ({notionPages.length}):
                </div>
                {isLoadingNotion ? (
                  <div className="font-mono text-xs text-terminal-dim">
                    Loading...
                  </div>
                ) : notionPages.length === 0 ? (
                  <div className="font-mono text-xs text-terminal-dim">
                    No pages found. Make sure you shared pages with your
                    integration.
                  </div>
                ) : (
                  notionPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center gap-2 px-3 py-2 bg-terminal-bg border border-terminal-border mb-1"
                    >
                      <span>{page.icon || "📄"}</span>
                      <span className="font-mono text-xs text-terminal-text truncate flex-1">
                        {page.title}
                      </span>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-accent text-xs shrink-0"
                      >
                        ↗
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-3">
              <button
                onClick={() => setShowNotionBrowser(false)}
                className="px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm"
              >
                [ Close ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Repos Modal */}
      {showGitHubRepos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-3">
              &lt;github_repositories/&gt;
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingGitHub ? (
                <div className="font-mono text-xs text-terminal-dim">
                  Loading repositories...
                </div>
              ) : githubRepos.length === 0 ? (
                <div className="font-mono text-xs text-terminal-dim">
                  No repositories found
                </div>
              ) : (
                githubRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-3 bg-terminal-bg border border-terminal-border hover:border-terminal-accent transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs md:text-sm text-terminal-accent hover:underline truncate"
                      >
                        {repo.fullName}
                      </a>
                      <span className="font-mono text-[10px] text-terminal-dim shrink-0">
                        ⭐ {repo.stars}
                      </span>
                    </div>
                    {repo.description && (
                      <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1 truncate">
                        {repo.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {repo.language && (
                        <span className="font-mono text-[10px] text-yellow-500">
                          ● {repo.language}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-terminal-dim">
                        {repo.isPrivate ? "🔒 Private" : "🌐 Public"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3">
              <button
                onClick={() => setShowGitHubRepos(false)}
                className="px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm"
              >
                [ Close ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
