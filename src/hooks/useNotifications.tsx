import { useState, createContext, useContext, ReactNode, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "error";
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface BackendNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  status?: string;
  isRead: boolean;
  createdAt?: string;
}

function mapBackendType(type?: string, status?: string): Notification["type"] {
  const t = (type || "").toLowerCase();
  const s = (status || "").toLowerCase();

  if (t.includes("error") || s.includes("failed")) return "error";
  if (t.includes("warning") || t.includes("alert")) return "warning";
  if (t.includes("success") || t.includes("transaction") || s.includes("sent")) return "success";
  return "info";
}

function mapNotification(item: BackendNotification): Notification {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: mapBackendType(item.type, item.status),
    timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
    read: item.isRead,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get<{
          notifications: BackendNotification[];
          unreadCount: number;
        }>("/notifications");
        setNotifications(res.notifications.map(mapNotification));
        setUnreadCount(res.unreadCount || 0);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const prev = notifications;
    let decrement = 0;
    setNotifications(current =>
      current.map(n => {
        if (n.id !== id) return n;
        if (!n.read) decrement = 1;
        return { ...n, read: true };
      })
    );
    if (decrement) setUnreadCount(c => Math.max(0, c - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      setNotifications(prev);
      if (decrement) setUnreadCount(c => c + 1);
      throw error;
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const prev = notifications;
    setNotifications(current => current.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await api.patch("/notifications/read-all");
    } catch (error) {
      setNotifications(prev);
      setUnreadCount(prev.filter(n => !n.read).length);
      throw error;
    }
  }, [notifications]);

  const clearNotification = useCallback(async (id: string) => {
    const prev = notifications;
    const removed = notifications.find(n => n.id === id);
    setNotifications(current => current.filter(n => n.id !== id));
    if (removed && !removed.read) setUnreadCount(c => Math.max(0, c - 1));

    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      setNotifications(prev);
      if (removed && !removed.read) setUnreadCount(c => c + 1);
      throw error;
    }
  }, [notifications]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
