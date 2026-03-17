"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useUIStore } from "@/stores";

/* ─── Toast Renderer (mount once in layout) ─────────────── */

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    icon: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  error: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    icon: "text-rose-400",
    bar: "bg-rose-500",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    icon: "text-amber-400",
    bar: "bg-amber-500",
  },
  info: {
    border: "border-teal-500/30",
    bg: "bg-teal-500/5",
    icon: "text-teal-400",
    bar: "bg-teal-500",
  },
};

export function ToastProvider() {
  const { notifications, removeNotification } = useUIStore();

  // Auto-dismiss after 4s
  React.useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[notifications.length - 1];
    const timer = setTimeout(() => removeNotification(latest.id), 4000);
    return () => clearTimeout(timer);
  }, [notifications, removeNotification]);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => {
          const Icon = icons[notif.type];
          const s = styles[notif.type];
          return (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={`pointer-events-auto relative w-80 overflow-hidden rounded-xl border ${s.border} ${s.bg} bg-[#1c1917]/95 shadow-2xl shadow-black/40 backdrop-blur-xl`}
            >
              <div className="flex items-start gap-3 p-4">
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${s.icon}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#fafaf9]">{notif.title}</p>
                  {notif.message && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[#78716c]">{notif.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="flex-shrink-0 rounded-md p-1 text-[#44403c] transition-colors hover:bg-[#231f1d] hover:text-[#d6d3d1]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Progress bar auto-dismiss indicator */}
              <motion.div
                className={`h-[2px] ${s.bar}`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─── Hook for convenient toast calls ───────────────────── */

export function useToast() {
  const addNotification = useUIStore((s) => s.addNotification);

  return React.useMemo(
    () => ({
      success: (title: string, message?: string) =>
        addNotification({ type: "success", title, message }),
      error: (title: string, message?: string) =>
        addNotification({ type: "error", title, message }),
      warning: (title: string, message?: string) =>
        addNotification({ type: "warning", title, message }),
      info: (title: string, message?: string) =>
        addNotification({ type: "info", title, message }),
    }),
    [addNotification]
  );
}
