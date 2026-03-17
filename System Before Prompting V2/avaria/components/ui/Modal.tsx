"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, description, children, wide }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", trap);
    return () => panel.removeEventListener("keydown", trap);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop absolute inset-0"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "modal-panel relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-[28px]",
              wide ? "max-w-2xl" : "max-w-xl"
            )}
          >
            <div className="gradient-line" />
            <div className="flex items-start justify-between gap-4 px-6 pb-0 pt-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">Action panel</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">{title}</h2>
                {description ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p> : null}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-2xl border border-white/8 bg-white/[0.04] p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function FormField({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
        {required ? <span className="ml-1 text-[var(--signal-rose)]">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-[11px] font-medium text-[var(--signal-rose)]">{error}</p> : null}
    </div>
  );
}

export const ModalInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--text-subtle)]",
        "focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]",
        className
      )}
      {...props}
    />
  )
);
ModalInput.displayName = "ModalInput";

export const ModalSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full cursor-pointer rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white",
        "focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
ModalSelect.displayName = "ModalSelect";

export function ModalFooter({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  danger = false,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/8 px-0 pt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-medium transition-all",
          danger
            ? "border border-[rgba(255,124,149,0.22)] bg-[rgba(255,124,149,0.12)] text-[var(--signal-rose)] hover:bg-[rgba(255,124,149,0.16)]"
            : "bg-[var(--brand-gradient)] text-[#041019]"
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description="This action cannot be undone.">
      <p className="text-sm leading-6 text-[var(--text-secondary)]">{message}</p>
      <ModalFooter onCancel={onClose} onSubmit={onConfirm} submitLabel={confirmLabel} loading={loading} danger />
    </Modal>
  );
}
