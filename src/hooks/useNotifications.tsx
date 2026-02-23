import { useState, createContext, useContext, ReactNode, useCallback } from "react";

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
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "Payment Successful",
    message: "Your payment of ₦45,000 to GTBank was confirmed on-chain.",
    type: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    action: { label: "View Transaction", href: "/history" },
  },
  {
    id: "2",
    title: "Deposit Received",
    message: "You received 100 USDT from 0x8f3c...2a1b",
    type: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: "3",
    title: "Escrow Released",
    message: "₦125,000 escrow payment has been released to vendor.",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
  },
  {
    id: "4",
    title: "Low Balance Alert",
    message: "Your USDT balance is below ₦50,000. Consider topping up.",
    type: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
  {
    id: "5",
    title: "Security Update",
    message: "New login detected from Lagos, Nigeria. Was this you?",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
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
