import { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { TerminalButton } from "../components/ui/TerminalButton";
import { useAuthStore } from "../store/authStore";
import { usePreferencesStore } from "../store/preferencesStore";
import { exportBackup } from "../api/export";
import { useDownload } from "../hooks/useDownload";

export function SettingsPage() {
  const { user } = useAuthStore();
  const { preferences, loadPreferences, savePreferences, isLoading } =
    usePreferencesStore();
  const [localPrefs, setLocalPrefs] = useState<any>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const { downloadBlob } = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const [showJarvisSection, setShowJarvisSection] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleSave = async () => {
    if (localPrefs) {
      await savePreferences(localPrefs);
      setSaveMessage("✓ Saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleToggleJarvis = (enabled: boolean) => {
    setLocalPrefs({ ...localPrefs, jarvisEnabled: enabled });
  };

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const blob = await exportBackup();
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `backup_${date}.json`);
    } catch (error) {
      console.error("Error creating backup:", error);
      alert("Error creating backup. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header Responsivo */}
          <div className="flex items-center justify-between mb-4 md:mb-8 flex-wrap gap-2">
            <h1 className="font-mono text-lg sm:text-xl md:text-2xl text-terminal-accent">
              ❯ Settings
            </h1>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              {saveMessage && (
                <span className="font-mono text-xs md:text-sm text-terminal-accent">
                  {saveMessage}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors disabled:opacity-50"
              >
                [ Save ]
              </button>
            </div>
          </div>

          <div className="space-y-3 md:space-y-6">
            {/* Data Export */}
            <div className="bg-terminal-surface border border-terminal-border p-4 md:p-6">
              <h2 className="font-mono text-base md:text-lg text-terminal-accent mb-3 md:mb-4">
                &lt;data_export/&gt;
              </h2>
              <p className="font-mono text-[10px] md:text-xs text-terminal-dim mb-3 md:mb-4">
                Download all your data as a JSON backup file. This includes
                conversations, messages, notes, and settings.
              </p>
              <button
                onClick={handleBackup}
                disabled={isExporting}
                className="w-full sm:w-auto px-4 py-2 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? "[ ... ]" : "[ Download Backup ]"}
              </button>
            </div>

            {/* JARVIS Settings */}
            <div className="bg-terminal-surface border border-terminal-border p-4 md:p-6">
              {/* Header da seção com toggle para mobile */}
              <button
                onClick={() => setShowJarvisSection(!showJarvisSection)}
                className="w-full flex items-center justify-between mb-3 md:mb-4"
              >
                <h2 className="font-mono text-base md:text-lg text-terminal-accent">
                  &lt;jarvis_assistant/&gt;
                </h2>
                <span className="font-mono text-terminal-dim text-xs md:hidden">
                  {showJarvisSection ? "▲" : "▼"}
                </span>
              </button>

              <div
                className={`space-y-3 md:space-y-4 ${showJarvisSection ? "" : "hidden md:block"}`}
              >
                {/* Toggle JARVIS */}
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div>
                    <div className="font-mono text-xs md:text-sm text-terminal-text">
                      Enable JARVIS
                    </div>
                    <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-0.5 md:mt-1">
                      Voice assistant floating button
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleJarvis(!localPrefs?.jarvisEnabled)
                    }
                    className={`relative w-12 md:w-14 h-7 md:h-8 rounded-full transition-colors shrink-0 ${
                      localPrefs?.jarvisEnabled
                        ? "bg-terminal-accent"
                        : "bg-terminal-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 md:top-1 w-6 h-6 rounded-full bg-terminal-bg transition-all ${
                        localPrefs?.jarvisEnabled
                          ? "left-5 md:left-7"
                          : "left-0.5 md:left-1"
                      }`}
                    />
                  </button>
                </div>

                {localPrefs?.jarvisEnabled && (
                  <>
                    {/* Wake Word */}
                    <div>
                      <label className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1 block">
                        Wake word (always listening mode):
                      </label>
                      <input
                        value={localPrefs?.jarvisWakeWord || "jarvis"}
                        onChange={(e) =>
                          setLocalPrefs({
                            ...localPrefs,
                            jarvisWakeWord: e.target.value,
                          })
                        }
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 focus:outline-none focus:border-terminal-accent"
                        placeholder="jarvis"
                      />
                    </div>

                    {/* Language */}
                    <div>
                      <label className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1 block">
                        Default language:
                      </label>
                      <div className="flex gap-1 md:gap-2 flex-wrap">
                        {["pt-BR", "en-US"].map((lang) => (
                          <button
                            key={lang}
                            onClick={() =>
                              setLocalPrefs({
                                ...localPrefs,
                                jarvisLanguage: lang,
                              })
                            }
                            className={`px-3 md:px-4 py-1.5 md:py-2 font-mono text-xs md:text-sm border transition-colors ${
                              localPrefs?.jarvisLanguage === lang
                                ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                                : "bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-accent"
                            }`}
                          >
                            {lang === "pt-BR" ? "🇧🇷 PT" : "🇺🇸 EN"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Voice selection */}
                    <div>
                      <label className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1 block">
                        Voice:
                      </label>
                      <select
                        value={
                          localPrefs?.jarvisVoice || "EXAVITQu4vr4xnSDxMaL"
                        }
                        onChange={(e) =>
                          setLocalPrefs({
                            ...localPrefs,
                            jarvisVoice: e.target.value,
                          })
                        }
                        className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 focus:outline-none focus:border-terminal-accent"
                      >
                        <option value="EXAVITQu4vr4xnSDxMaL">
                          Sarah (Female)
                        </option>
                        <option value="TX3LPaxmHKxFdv7VOQHJ">
                          Liam (Male)
                        </option>
                        <option value="MF3mGyEYCl7XYWbV9V6O">
                          Emily (Female)
                        </option>
                        <option value="VR6AewLTigWG4xSOukaG">
                          Arnold (Male)
                        </option>
                        <option value="pNInz6obpgDQGcFmaJgB">
                          Adam (Male, Deep)
                        </option>
                        <option value="yoZ06aMxZJJ28mfd3POQ">Sam (Male)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Account */}
            <div className="bg-terminal-surface border border-terminal-border p-4 md:p-6">
              <h2 className="font-mono text-base md:text-lg text-terminal-accent mb-3 md:mb-4">
                &lt;account/&gt;
              </h2>
              <div className="font-mono text-xs md:text-sm text-terminal-text break-all">
                Email:{" "}
                <span className="text-terminal-accent">{user?.email}</span>
              </div>
              <div className="font-mono text-[10px] md:text-sm text-terminal-dim mt-1 md:mt-2 break-all">
                ID: {user?.id}
              </div>
            </div>

            {/* About */}
            <div className="bg-terminal-surface border border-terminal-border p-4 md:p-6">
              <h2 className="font-mono text-base md:text-lg text-terminal-accent mb-3 md:mb-4">
                &lt;about/&gt;
              </h2>
              <div className="font-mono text-xs md:text-sm text-terminal-text space-y-1 md:space-y-2">
                <p>All in One Assistant Platform</p>
                <p className="text-terminal-dim">Version: 1.0.0</p>
                <p className="text-terminal-dim">Theme: Terminal (fixed)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
