import { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { noteTemplates } from "../data/noteTemplates";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Module {
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  count?: number;
}

interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  totalNotes: number;
  totalSpreadsheets: number;
  totalContacts: number;
  totalEvents: number;
  totalCharts: number;
  totalTokens: number;
  recentConversations: any[];
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">(
    "overview",
  );

  useEffect(() => {
    loadStats();
    loadAnalytics();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get("/stats/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get("/analytics/dashboard");
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const modules: Module[] = [
    {
      title: "AI Chat",
      description: "Chat with AI about anything",
      icon: "❯",
      path: "/chat",
      color: "text-terminal-accent",
      count: stats?.totalConversations || 0,
    },
    {
      title: "Notes",
      description: "Create and manage your documents",
      icon: "📝",
      path: "/notes",
      color: "text-blue-400",
      count: stats?.totalNotes || 0,
    },
    {
      title: "Files",
      description: "Upload and manage your files",
      icon: "📁",
      path: "/files",
      color: "text-cyan-400",
    },
    {
      title: "Spreadsheets",
      description: "Create and manage smart spreadsheets",
      icon: "▦",
      path: "/spreadsheets",
      color: "text-green-400",
      count: stats?.totalSpreadsheets || 0,
    },
    {
      title: "Charts",
      description: "Visualize data with interactive charts",
      icon: "📊",
      path: "/charts",
      color: "text-yellow-400",
      count: stats?.totalCharts || 0,
    },
    {
      title: "Calendar",
      description: "Organize your schedule",
      icon: "📅",
      path: "/calendar",
      color: "text-purple-400",
      count: stats?.totalEvents || 0,
    },
    {
      title: "Reminders",
      description: "Set reminders and get notified",
      icon: "⏰",
      path: "/reminders",
      color: "text-red-400",
    },
    {
      title: "Contacts",
      description: "Manage contacts and WhatsApp integration",
      icon: "👤",
      path: "/contacts",
      color: "text-orange-400",
      count: stats?.totalContacts || 0,
    },
  ];

  const renderAnalyticsTab = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Token Trend */}
      {analytics?.tokenTrend && (
        <div className="bg-terminal-surface border border-terminal-border p-3 md:p-6">
          <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-3 md:mb-4">
            &lt;token_trend_last_7_days/&gt;
          </h2>
          <div className="h-[200px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.tokenTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis
                  dataKey="date"
                  stroke="#666666"
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#666666" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    border: "1px solid #00ff00",
                    fontFamily: "Roboto Mono",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#00ff00"
                  fill="#00ff00"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily Usage */}
      {analytics?.dailyUsage && (
        <div className="bg-terminal-surface border border-terminal-border p-3 md:p-6">
          <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-3 md:mb-4">
            &lt;daily_activity/&gt;
          </h2>
          <div className="h-[200px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis
                  dataKey="date"
                  stroke="#666666"
                  tick={{ fontSize: 10 }}
                />
                <YAxis stroke="#666666" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    border: "1px solid #00ff00",
                    fontFamily: "Roboto Mono",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="messages" fill="#00ff00" name="Messages" />
                <Bar dataKey="notes" fill="#00cc00" name="Notes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hourly Activity */}
      {analytics?.hourlyActivity && (
        <div className="bg-terminal-surface border border-terminal-border p-3 md:p-6">
          <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-3 md:mb-4">
            &lt;activity_by_hour/&gt;
          </h2>
          <div className="h-[150px] md:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis
                  dataKey="hour"
                  stroke="#666666"
                  tick={{ fontSize: 8 }}
                  interval={2}
                />
                <YAxis stroke="#666666" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    border: "1px solid #00ff00",
                    fontFamily: "Roboto Mono",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="activity" fill="#00ff88" name="Activity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Module Usage */}
      {analytics?.moduleUsage && (
        <div className="bg-terminal-surface border border-terminal-border p-3 md:p-6">
          <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-3 md:mb-4">
            &lt;module_usage/&gt;
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {Object.entries(analytics.moduleUsage).map(([key, value]) => (
              <div
                key={key}
                className="bg-terminal-bg border border-terminal-border p-2 md:p-3 text-center"
              >
                <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                  {value as number}
                </div>
                <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1 capitalize">
                  {key}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {analytics?.summary && (
        <div className="bg-terminal-surface border border-terminal-border p-3 md:p-6">
          <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-3 md:mb-4">
            &lt;summary/&gt;
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <div className="bg-terminal-bg border border-terminal-border p-2 md:p-3">
              <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                {analytics.summary.totalMessages}
              </div>
              <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                Messages
              </div>
            </div>
            <div className="bg-terminal-bg border border-terminal-border p-2 md:p-3">
              <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                {analytics.summary.totalTokens.toLocaleString()}
              </div>
              <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                Tokens
              </div>
            </div>
            <div className="bg-terminal-bg border border-terminal-border p-2 md:p-3">
              <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                {analytics.summary.activeReminders}
              </div>
              <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                Active Reminders
              </div>
            </div>
            <div className="bg-terminal-bg border border-terminal-border p-2 md:p-3">
              <div className="font-mono text-lg md:text-2xl text-terminal-accent capitalize">
                {analytics.summary.mostUsedModule}
              </div>
              <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                Most Used
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-3 md:p-4 lg:p-8">
          {/* Header com Tabs */}
          <div className="mb-4 md:mb-8">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3 md:mb-4">
              <h1 className="font-mono text-lg md:text-2xl text-terminal-accent">
                ❯ Dashboard
              </h1>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-3 md:px-4 py-1.5 md:py-2 font-mono text-xs md:text-sm border transition-colors ${
                    activeTab === "overview"
                      ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                      : "bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-accent"
                  }`}
                >
                  [ Overview ]
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 md:px-4 py-1.5 md:py-2 font-mono text-xs md:text-sm border transition-colors ${
                    activeTab === "analytics"
                      ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                      : "bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-accent"
                  }`}
                >
                  [ Analytics ]
                </button>
              </div>
            </div>
            <p className="font-mono text-xs md:text-sm text-terminal-dim">
              &lt;welcome_to_your_command_center/&gt;
            </p>
          </div>

          {activeTab === "overview" ? (
            <>
              {/* Stats Overview */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
                  <div className="bg-terminal-surface border border-terminal-border p-3 md:p-4">
                    <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                      {stats.totalMessages}
                    </div>
                    <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                      Total Messages
                    </div>
                  </div>
                  <div className="bg-terminal-surface border border-terminal-border p-3 md:p-4">
                    <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                      {stats.totalConversations}
                    </div>
                    <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                      Conversations
                    </div>
                  </div>
                  <div className="bg-terminal-surface border border-terminal-border p-3 md:p-4">
                    <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                      {stats.totalTokens.toLocaleString()}
                    </div>
                    <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                      Tokens Used
                    </div>
                  </div>
                  <div className="bg-terminal-surface border border-terminal-border p-3 md:p-4">
                    <div className="font-mono text-lg md:text-2xl text-terminal-accent">
                      {stats.totalNotes}
                    </div>
                    <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1">
                      Notes
                    </div>
                  </div>
                </div>
              )}

              {/* Modules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {modules.map((module) => (
                  <button
                    key={module.path}
                    onClick={() => navigate(module.path)}
                    className="text-left p-4 md:p-6 bg-terminal-surface border border-terminal-border hover:border-terminal-accent transition-colors group"
                  >
                    <div
                      className={`text-2xl md:text-3xl mb-3 md:mb-4 ${module.color}`}
                    >
                      {module.icon}
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="font-mono text-sm md:text-lg text-terminal-text group-hover:text-terminal-accent transition-colors">
                        {module.title}
                      </div>
                      {module.count !== undefined && module.count > 0 && (
                        <span className="font-mono text-[10px] md:text-xs text-terminal-dim bg-terminal-bg px-2 py-0.5 border border-terminal-border">
                          {module.count}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-1 md:mt-2">
                      {module.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Templates */}
              <div className="mt-6 md:mt-8">
                <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-3 md:mb-4">
                  &lt;quick_templates/&gt;
                </h2>
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
                  {noteTemplates.slice(0, 6).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => navigate("/notes")}
                      className="flex-shrink-0 p-3 md:p-4 bg-terminal-surface border border-terminal-border hover:border-terminal-accent transition-colors min-w-[100px] md:min-w-[120px]"
                    >
                      <div className="text-xl md:text-2xl mb-1 md:mb-2">
                        {template.icon}
                      </div>
                      <div className="font-mono text-[10px] md:text-xs text-terminal-text">
                        {template.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Conversations */}
              {stats?.recentConversations &&
                stats.recentConversations.length > 0 && (
                  <div className="mt-6 md:mt-8">
                    <h2 className="font-mono text-sm md:text-lg text-terminal-accent mb-3 md:mb-4">
                      &lt;recent_conversations/&gt;
                    </h2>
                    <div className="space-y-1 md:space-y-2">
                      {stats.recentConversations.map((conv: any) => (
                        <button
                          key={conv.id}
                          onClick={() => navigate(`/chat/${conv.id}`)}
                          className="w-full text-left bg-terminal-surface border border-terminal-border p-2 md:p-3 hover:border-terminal-accent transition-colors"
                        >
                          <div className="font-mono text-xs md:text-sm text-terminal-text truncate">
                            {conv.title || "Untitled"}
                          </div>
                          <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-0.5 md:mt-1">
                            {new Date(conv.updatedAt).toLocaleDateString(
                              "en-US",
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </>
          ) : (
            renderAnalyticsTab()
          )}
        </div>
      </div>
    </div>
  );
}
