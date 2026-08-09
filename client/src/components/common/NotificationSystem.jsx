import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import {
  useNotificationContext,
  NOTIFICATION_TYPES,
} from "@/context/NotificationContext";
import { cn } from "@/utils/cn";

// ============================================================
// Icon map per notification type
// ============================================================

const ICONS = {
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircle2,
  [NOTIFICATION_TYPES.ERROR]: AlertCircle,
  [NOTIFICATION_TYPES.WARNING]: AlertTriangle,
  [NOTIFICATION_TYPES.INFO]: Info,
  [NOTIFICATION_TYPES.PROGRESS]: Loader2,
};

const STYLES = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    icon: "text-[#22C55E]",
    bg: "bg-[#22C55E]/10",
    border: "border-[#388E3C]/20",
  },
  [NOTIFICATION_TYPES.ERROR]: {
    icon: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10",
    border: "border-[#FF6161]/20",
  },
  [NOTIFICATION_TYPES.WARNING]: {
    icon: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
    border: "border-[#FF9F00]/20",
  },
  [NOTIFICATION_TYPES.INFO]: {
    icon: "text-[#2874F0]",
    bg: "bg-[#2874F0]/10",
    border: "border-[#2874F0]/20",
  },
  [NOTIFICATION_TYPES.PROGRESS]: {
    icon: "text-[#2874F0]",
    bg: "bg-[#2874F0]/10",
    border: "border-[#2874F0]/20",
  },
};

// ============================================================
// Individual Toast
// ============================================================

function Toast({ notification, onRemove }) {
  const { id, type, title, message, meta } = notification;
  const Icon = ICONS[type];
  const style = STYLES[type];

  return (
    <motion.div
      key={id}
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative w-80 rounded-2xl border bg-white shadow-float",
        "overflow-hidden p-4",
        style.border,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("mt-0.5 flex-shrink-0 rounded-lg p-1.5", style.bg)}>
          <Icon
            className={cn(
              "w-4 h-4",
              style.icon,
              type === NOTIFICATION_TYPES.PROGRESS && "animate-spin",
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-[#212121] leading-snug">
              {title}
            </p>
          )}
          {message && (
            <p className="text-sm text-[#878787] mt-0.5 leading-snug">
              {message}
            </p>
          )}

          {/* Progress Bar */}
          {meta?.progress !== undefined && (
            <div className="mt-2 h-1.5 rounded-full bg-[#F8F9FA] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#2874F0]"
                animate={{ width: `${meta.progress}%` }}
                transition={{ ease: "linear", duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Close Button */}
        {!notification.persistent && (
          <button
            onClick={() => onRemove(id)}
            className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1.5 rounded-lg text-[#878787] hover:text-[#212121] hover:bg-[#F8F9FA] transition-all-fast"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Toast Container
// ============================================================

export default function NotificationSystem() {
  const { notifications, remove } = useNotificationContext();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-toast flex flex-col gap-3 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast notification={notification} onRemove={remove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
