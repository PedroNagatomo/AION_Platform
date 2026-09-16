import { useEffect, useCallback, useRef, useState } from "react";
import { getDueReminders, type Reminder } from "../api/reminders";

export function useNotifications() {
  const notifiedRemindersRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported",
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.log("❌ Notifications not supported in this browser");
      setPermissionStatus("unsupported");
      return false;
    }

    console.log("Current permission:", Notification.permission);

    if (Notification.permission === "granted") {
      setPermissionStatus("granted");
      return true;
    }

    if (Notification.permission === "denied") {
      setPermissionStatus("denied");
      console.log(
        "❌ Permission denied. Enable notifications in browser settings.",
      );
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log("Permission result:", permission);
      setPermissionStatus(permission);

      if (permission === "granted") {
        // Test notification
        const testNotification = new Notification("✅ Notifications enabled!", {
          body: "You will now receive reminder notifications.",
          icon: "/vite.svg",
        });
        setTimeout(() => testNotification.close(), 5000);
        return true;
      } else {
        console.log("❌ Permission not granted:", permission);
        return false;
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      setPermissionStatus("error");
      return false;
    }
  }, []);

  const showNotification = useCallback((reminder: Reminder) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      console.warn("⚠️ Cannot show notification - permission not granted");
      return;
    }

    console.log("🔔 Showing notification for:", reminder.title);

    try {
      const notification = new Notification(`⏰ ${reminder.title}`, {
        body: reminder.description || "Reminder due now!",
        icon: "/vite.svg",
        tag: reminder.id,
        requireInteraction: true,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onerror = (e) => {
        console.error("Notification error:", e);
      };

      // Auto-close after 15 seconds
      setTimeout(() => notification.close(), 15000);

      // Play sound if available
      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
        );
        audio.play().catch(() => {});
      } catch (e) {
        // Ignore audio errors
      }
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, []);

  const checkDueReminders = useCallback(async () => {
    try {
      const dueReminders = await getDueReminders();
      console.log(`📋 Checked ${dueReminders.length} due reminders`);

      for (const reminder of dueReminders) {
        const reminderTime = new Date(reminder.reminderTime);
        const now = new Date();
        const timeDiff = now.getTime() - reminderTime.getTime();

        console.log(
          `⏰ "${reminder.title}" - Due: ${reminderTime.toLocaleString()} - Diff: ${Math.round(timeDiff / 1000)}s ago`,
        );

        // Só notificar se o lembrete está devido (dentro de 5 minutos)
        if (timeDiff >= 0 && timeDiff <= 5 * 60 * 1000) {
          if (!notifiedRemindersRef.current.has(reminder.id)) {
            console.log("🔔 Notifying:", reminder.title);
            showNotification(reminder);
            notifiedRemindersRef.current.add(reminder.id);
          } else {
            console.log("⏭️ Already notified:", reminder.title);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking reminders:", error);
    }
  }, [showNotification]);

  const startReminderCheck = useCallback(async () => {
    // Request permission
    const granted = await requestPermission();

    if (granted) {
      console.log("✅ Notification permission granted - starting checks");

      // Check immediately
      await checkDueReminders();

      // Check every 15 seconds (reduced from 30s)
      intervalRef.current = setInterval(checkDueReminders, 15000);
    } else {
      console.log("❌ Notification permission not granted - cannot check");
    }
  }, [checkDueReminders, requestPermission]);

  const stopReminderCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopReminderCheck();
    };
  }, [stopReminderCheck]);

  return {
    startReminderCheck,
    stopReminderCheck,
    requestPermission,
    checkDueReminders,
    permissionStatus,
  };
}
