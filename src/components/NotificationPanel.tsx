import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  X, 
  CheckCheck,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const typeConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  info: {
    icon: Info,
    color: "text-pending",
    bg: "bg-pending/10",
  },
  error: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NotificationItem({ 
  notification, 
  onClear,
  onNavigate,
}: { 
  notification: Notification;
  onClear: () => void;
  onNavigate: (href: string) => void;
}) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-4 rounded-xl border transition-colors ${
        notification.read 
          ? "bg-background border-border" 
          : "bg-secondary/50 border-primary/20"
      }`}
    >
      <div className="flex gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {notification.message}
          </p>
          
          {notification.action && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-2 text-primary"
              onClick={() => onNavigate(notification.action!.href)}
            >
              {notification.action.label}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNavigate = (href: string, notificationId: string) => {
    markAsRead(notificationId);
    onOpenChange(false);
    navigate(href);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {unreadCount} new
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="p-4 space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClear={() => clearNotification(notification.id)}
                  onNavigate={(href) => handleNavigate(href, notification.id)}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4">
                  <CheckCheck className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No notifications to show
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
