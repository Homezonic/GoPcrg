import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Enrollment, Payment } from "@/types/contribution";
import NiBell from "@/icons/nexture/ni-bell";
import NiCross from "@/icons/nexture/ni-cross";

interface Notification {
  id: string;
  type: "maturity" | "payment_verified" | "payment_rejected" | "payment_reminder";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  enrollmentId?: string;
  paymentId?: string;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user) return;

    const newNotifications: Notification[] = [];

    try {
      // Check for upcoming maturity
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE");

      const now = new Date();
      enrollments?.forEach((enrollment: Enrollment) => {
        const maturityDate = new Date(enrollment.maturity_date);
        const daysUntilMaturity = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilMaturity <= 7 && daysUntilMaturity >= 0) {
          newNotifications.push({
            id: `maturity-${enrollment.id}`,
            type: "maturity",
            title: daysUntilMaturity === 0 ? "Matured Today!" : `Maturing in ${daysUntilMaturity} days`,
            message: `${enrollment.plan?.name || "Your contribution"} ${daysUntilMaturity === 0 ? "has matured" : `will mature on ${maturityDate.toLocaleDateString()}`}. Expected payout: $${enrollment.payout_amount.toLocaleString()}`,
            timestamp: maturityDate,
            read: false,
            enrollmentId: enrollment.id,
          });
        }
      });

      // Check for recent payment status updates (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: payments } = await supabase
        .from("payments")
        .select("*, enrollment:enrollments(*, plan:plans(*))")
        .eq("user_id", user.id)
        .gte("updated_at", sevenDaysAgo.toISOString());

      payments?.forEach((payment: Payment & { enrollment: Enrollment }) => {
        if (payment.status === "VERIFIED") {
          newNotifications.push({
            id: `payment-verified-${payment.id}`,
            type: "payment_verified",
            title: "Payment Verified ✅",
            message: `Your payment of $${payment.amount.toLocaleString()} for ${payment.enrollment?.plan?.name || "contribution"} has been verified!`,
            timestamp: new Date(payment.updated_at || payment.created_at),
            read: false,
            paymentId: payment.id,
            enrollmentId: payment.enrollment_id,
          });
        } else if (payment.status === "REJECTED") {
          newNotifications.push({
            id: `payment-rejected-${payment.id}`,
            type: "payment_rejected",
            title: "Payment Rejected ❌",
            message: `Your payment of $${payment.amount.toLocaleString()} was rejected. ${payment.notes || "Please contact support."}`,
            timestamp: new Date(payment.updated_at || payment.created_at),
            read: false,
            paymentId: payment.id,
            enrollmentId: payment.enrollment_id,
          });
        }
      });

      // Sort by timestamp (newest first)
      newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Load read status from localStorage
      const readIds = JSON.parse(localStorage.getItem("gopcrg_read_notifications") || "[]");
      newNotifications.forEach((notif) => {
        if (readIds.includes(notif.id)) {
          notif.read = true;
        }
      });

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Refresh every 5 minutes
      const interval = setInterval(loadNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, loadNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    const readIds = JSON.parse(localStorage.getItem("gopcrg_read_notifications") || "[]");
    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      localStorage.setItem("gopcrg_read_notifications", JSON.stringify(readIds));
    }

    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem("gopcrg_read_notifications", JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "maturity":
        return "🎉";
      case "payment_verified":
        return "✅";
      case "payment_rejected":
        return "❌";
      case "payment_reminder":
        return "📅";
      default:
        return "📢";
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)} size="medium">
        <Badge badgeContent={unreadCount} color="error">
          <NiBell />
        </Badge>
      </IconButton>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box className="w-96 h-full flex flex-col">
          {/* Header */}
          <Box className="p-4 flex items-center justify-between border-b border-divider">
            <Typography variant="h5">Notifications</Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <NiCross />
            </IconButton>
          </Box>

          {/* Actions */}
          {unreadCount > 0 && (
            <Box className="p-3 border-b border-divider">
              <Button size="small" variant="text" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            </Box>
          )}

          {/* Notifications List */}
          <Box className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <Box className="flex flex-col items-center justify-center h-full text-center p-8">
                <Typography variant="h6" className="text-text-secondary mb-2">
                  No notifications
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  You're all caught up!
                </Typography>
              </Box>
            ) : (
              <List>
                {notifications.map((notification, index) => (
                  <Box key={notification.id}>
                    <ListItem
                      className={`cursor-pointer hover:bg-action-hover ${!notification.read ? "bg-action-selected" : ""}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <ListItemText
                        primary={
                          <Box className="flex items-start gap-2">
                            <Typography variant="body2">{getNotificationIcon(notification.type)}</Typography>
                            <Box className="flex-1">
                              <Box className="flex items-center justify-between mb-1">
                                <Typography variant="subtitle2">{notification.title}</Typography>
                                {!notification.read && (
                                  <Box className="w-2 h-2 rounded-full bg-primary ml-2" />
                                )}
                              </Box>
                              <Typography variant="body2" className="text-text-secondary">
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" className="text-text-secondary">
                                {getTimeAgo(notification.timestamp)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
