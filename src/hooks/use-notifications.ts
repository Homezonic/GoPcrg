import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Enrollment } from "@/types/contribution";

interface NotificationSettings {
  enabled: boolean;
  permission: NotificationPermission;
}

export function useNotifications() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    permission: "default",
  });

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setSettings({
        enabled: Notification.permission === "granted",
        permission: Notification.permission,
      });
    }
  }, []);

  useEffect(() => {
    if (user && settings.enabled) {
      checkMaturityAlerts();
      // Check every hour
      const interval = setInterval(checkMaturityAlerts, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, settings.enabled]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    setSettings({
      enabled: permission === "granted",
      permission,
    });

    return permission === "granted";
  };

  const checkMaturityAlerts = async () => {
    if (!user) return;

    try {
      const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE");

      if (error) throw error;

      const now = new Date();
      enrollments?.forEach((enrollment: Enrollment) => {
        const maturityDate = new Date(enrollment.maturity_date);
        const daysUntilMaturity = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send notifications at 7, 3, and 1 day(s) before maturity
        if (daysUntilMaturity === 7) {
          sendNotification(
            "Maturity Alert - 7 Days",
            `Your ${enrollment.plan?.name || "contribution"} will mature in 7 days! Expected payout: $${enrollment.payout_amount.toLocaleString()}`
          );
        } else if (daysUntilMaturity === 3) {
          sendNotification(
            "Maturity Alert - 3 Days",
            `Only 3 days until your ${enrollment.plan?.name || "contribution"} matures! Get ready for $${enrollment.payout_amount.toLocaleString()}`
          );
        } else if (daysUntilMaturity === 1) {
          sendNotification(
            "Maturity Alert - Tomorrow!",
            `Your ${enrollment.plan?.name || "contribution"} matures tomorrow! Payout: $${enrollment.payout_amount.toLocaleString()}`
          );
        } else if (daysUntilMaturity === 0) {
          sendNotification(
            "🎉 Matured Today!",
            `Your ${enrollment.plan?.name || "contribution"} has matured! Request your payout of $${enrollment.payout_amount.toLocaleString()}`
          );
        }
      });
    } catch (error) {
      console.error("Error checking maturity alerts:", error);
    }
  };

  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (!settings.enabled || Notification.permission !== "granted") return;

    const notification = new Notification(title, {
      body,
      icon: "/favicon/favicon-32x32.png",
      badge: "/favicon/favicon-32x32.png",
      tag: "gopcrg-alert",
      requireInteraction: false,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  };

  const sendPaymentReminder = (enrollmentName: string, amount: number, daysOverdue: number) => {
    if (daysOverdue > 0) {
      sendNotification(
        "⚠️ Payment Overdue",
        `Your ${enrollmentName} payment of $${amount.toLocaleString()} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`
      );
    } else {
      sendNotification(
        "📅 Payment Due Today",
        `Don't forget! Your ${enrollmentName} payment of $${amount.toLocaleString()} is due today`
      );
    }
  };

  const sendPaymentVerified = (enrollmentName: string, amount: number) => {
    sendNotification(
      "✅ Payment Verified",
      `Your payment of $${amount.toLocaleString()} for ${enrollmentName} has been verified!`
    );
  };

  const sendPaymentRejected = (enrollmentName: string, amount: number, reason?: string) => {
    sendNotification(
      "❌ Payment Rejected",
      `Your payment of $${amount.toLocaleString()} for ${enrollmentName} was rejected. ${reason || "Please contact support."}`
    );
  };

  return {
    settings,
    requestPermission,
    sendNotification,
    sendPaymentReminder,
    sendPaymentVerified,
    sendPaymentRejected,
    checkMaturityAlerts,
  };
}
