import { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import {
  getReminders,
  createReminder,
  completeReminder,
  deleteReminder,
  type Reminder,
} from "../api/reminders";
import { useNotifications } from "../hooks/useNotifications";

const REPEAT_OPTIONS = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminderTime: "",
    repeatType: "NONE",
    notifyBeforeMinutes: 0,
  });
  const [filter, setFilter] = useState<"all" | "active" | "completed">(
    "active",
  );

  const { startReminderCheck, requestPermission, permissionStatus } =
    useNotifications();

  useEffect(() => {
    loadReminders();
    startReminderCheck();
  }, []);

  const loadReminders = async () => {
    setIsLoading(true);
    try {
      const data = await getReminders();
      setReminders(data);
    } catch (error) {
      console.error("Error loading reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToISOWithoutTimezone = (dateTimeLocal: string): string => {
    return dateTimeLocal + ":00";
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.reminderTime) {
      alert("Title and time are required");
      return;
    }

    try {
      const localIsoTime = convertToISOWithoutTimezone(
        newReminder.reminderTime,
      );

      const created = await createReminder({
        ...newReminder,
        reminderTime: localIsoTime,
      });

      setReminders([...reminders, created]);
      setNewReminder({
        title: "",
        description: "",
        reminderTime: "",
        repeatType: "NONE",
        notifyBeforeMinutes: 0,
      });
      setShowAdd(false);

      await requestPermission();
    } catch (error) {
      console.error("Error creating reminder:", error);
      alert("Error creating reminder");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id);
      setReminders(
        reminders.map((r) => (r.id === id ? { ...r, isCompleted: true } : r)),
      );
    } catch (error) {
      console.error("Error completing reminder:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this reminder?")) {
      try {
        await deleteReminder(id);
        setReminders(reminders.filter((r) => r.id !== id));
      } catch (error) {
        console.error("Error deleting reminder:", error);
      }
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === "granted") {
      const testNotification = new Notification("🔔 Test Notification", {
        body: "This is a test notification from AION All in One!",
        icon: "/vite.svg",
      });
      setTimeout(() => testNotification.close(), 5000);
    } else {
      requestPermission().then((granted) => {
        if (granted) {
          const testNotification = new Notification("🔔 Test Notification", {
            body: "Notifications are now enabled!",
            icon: "/vite.svg",
          });
          setTimeout(() => testNotification.close(), 5000);
        }
      });
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === "active") return !r.isCompleted;
    if (filter === "completed") return r.isCompleted;
    return true;
  });

  const formatDateTime = (dateStr: string) => {
    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = (timePart || "00:00").split(":").map(Number);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    const minuteStr = String(minute).padStart(2, "0");

    return `${monthNames[month - 1]} ${String(day).padStart(2, "0")}, ${year}, ${hour12}:${minuteStr} ${ampm}`;
  };

  const isDue = (reminder: Reminder) => {
    if (reminder.isCompleted) return false;
    const reminderDate = new Date(reminder.reminderTime);
    const now = new Date();
    return reminderDate <= now;
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-2 md:p-4 lg:p-8 max-w-3xl mx-auto">
          {/* Header Responsivo */}
          <div className="flex items-center justify-between mb-4 md:mb-8 flex-wrap gap-2">
            <h1 className="font-mono text-lg md:text-2xl text-terminal-accent">
              ❯ Reminders
            </h1>
            <div className="flex gap-1 md:gap-2">
              <button
                onClick={handleTestNotification}
                className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-[10px] md:text-sm hover:border-terminal-accent hover:text-terminal-accent transition-colors"
              >
                [ Test ]
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="px-2 md:px-4 py-1 md:py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-[10px] md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [+ Reminder]
              </button>
            </div>
          </div>

          {/* Notification Permission Banner */}
          {permissionStatus !== "granted" && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500">
              <div className="font-mono text-xs md:text-sm text-yellow-500 mb-2">
                ⚠️ Notifications are{" "}
                {permissionStatus === "denied" ? "blocked" : "not enabled"}
              </div>
              <div className="flex gap-1 md:gap-2 flex-wrap">
                <button
                  onClick={requestPermission}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-yellow-500 text-terminal-bg font-mono text-xs md:text-sm hover:bg-yellow-400 transition-colors"
                >
                  [ Enable ]
                </button>
                <button
                  onClick={handleTestNotification}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-terminal-bg border border-yellow-500 text-yellow-500 font-mono text-xs md:text-sm hover:bg-yellow-500 hover:text-terminal-bg transition-colors"
                >
                  [ Test ]
                </button>
              </div>
            </div>
          )}

          {/* Filter Responsivo */}
          <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 flex-wrap">
            {[
              { id: "active", label: "Active" },
              { id: "completed", label: "Completed" },
              { id: "all", label: "All" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 md:px-4 py-1.5 md:py-2 font-mono text-xs md:text-sm border transition-colors ${
                  filter === f.id
                    ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                    : "bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reminders List */}
          {isLoading ? (
            <div className="font-mono text-xs md:text-sm text-terminal-dim">
              Loading...
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="font-mono text-xs md:text-sm text-terminal-dim">
              -- no reminders --
            </div>
          ) : (
            <div className="space-y-1 md:space-y-2">
              {filteredReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-3 md:p-4 border flex items-start gap-2 md:gap-3 ${
                    isDue(reminder)
                      ? "bg-red-500 bg-opacity-10 border-red-500"
                      : reminder.isCompleted
                        ? "bg-terminal-surface border-terminal-border opacity-50"
                        : "bg-terminal-surface border-terminal-border"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() =>
                      !reminder.isCompleted && handleComplete(reminder.id)
                    }
                    className={`mt-0.5 md:mt-1 w-5 h-5 border-2 flex items-center justify-center shrink-0 ${
                      reminder.isCompleted
                        ? "bg-terminal-accent border-terminal-accent"
                        : "border-terminal-border hover:border-terminal-accent"
                    }`}
                  >
                    {reminder.isCompleted && (
                      <span className="text-terminal-bg text-xs">✓</span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-mono text-xs md:text-sm ${
                        reminder.isCompleted
                          ? "line-through text-terminal-dim"
                          : "text-terminal-text"
                      }`}
                    >
                      {reminder.title}
                    </div>
                    {reminder.description && (
                      <div className="font-mono text-[10px] md:text-xs text-terminal-dim mt-0.5 md:mt-1">
                        {reminder.description}
                      </div>
                    )}
                    <div className="font-mono text-[10px] md:text-xs mt-1 md:mt-2 flex items-center gap-1 md:gap-2 flex-wrap">
                      <span
                        className={
                          isDue(reminder)
                            ? "text-red-500"
                            : "text-terminal-accent"
                        }
                      >
                        ⏰ {formatDateTime(reminder.reminderTime)}
                      </span>
                      {reminder.repeatType !== "NONE" && (
                        <span className="text-terminal-dim">
                          ↻ {reminder.repeatType}
                        </span>
                      )}
                      {isDue(reminder) && (
                        <span className="text-red-500 font-bold">[DUE]</span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="text-terminal-dim hover:text-red-500 font-mono text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Reminder Modal - Responsivo */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-md">
            <h3 className="font-mono text-base md:text-lg text-terminal-accent mb-3 md:mb-4">
              &lt;new_reminder/&gt;
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] md:text-xs text-terminal-dim">
                  title:
                </label>
                <input
                  placeholder="Meeting with team"
                  value={newReminder.title}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, title: e.target.value })
                  }
                  className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 focus:outline-none focus:border-terminal-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] md:text-xs text-terminal-dim">
                  description:
                </label>
                <textarea
                  value={newReminder.description}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      description: e.target.value,
                    })
                  }
                  className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm p-2 focus:outline-none focus:border-terminal-accent"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] md:text-xs text-terminal-dim">
                  date &amp; time:
                </label>
                <input
                  type="datetime-local"
                  value={newReminder.reminderTime}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      reminderTime: e.target.value,
                    })
                  }
                  className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 focus:outline-none focus:border-terminal-accent"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] md:text-xs text-terminal-dim mb-1 block">
                  repeat:
                </label>
                <select
                  value={newReminder.repeatType}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      repeatType: e.target.value,
                    })
                  }
                  className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 focus:outline-none focus:border-terminal-accent"
                >
                  {REPEAT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] md:text-xs text-terminal-dim">
                  notify before (minutes):
                </label>
                <input
                  type="number"
                  min="0"
                  value={String(newReminder.notifyBeforeMinutes)}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      notifyBeforeMinutes: Number(e.target.value),
                    })
                  }
                  className="bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 focus:outline-none focus:border-terminal-accent"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddReminder}
                  className="flex-1 px-4 py-2 bg-terminal-accent text-terminal-bg font-mono text-xs md:text-sm hover:bg-terminal-accent/80 transition-colors"
                >
                  [ Save ]
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs md:text-sm hover:border-terminal-accent transition-colors"
                >
                  [ Cancel ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
