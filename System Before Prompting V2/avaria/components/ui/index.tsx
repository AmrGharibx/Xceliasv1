"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color?: "emerald" | "pink" | "amber" | "teal" | "cyan";
  suffix?: string;
}

const toneMap = {
  emerald: {
    halo: "bg-[rgba(109,229,194,0.18)]",
    icon: "text-[var(--signal-mint)]",
    rail: "linear-gradient(90deg, var(--signal-mint), transparent)",
  },
  pink: {
    halo: "bg-[rgba(255,124,149,0.18)]",
    icon: "text-[var(--signal-rose)]",
    rail: "linear-gradient(90deg, var(--signal-rose), transparent)",
  },
  amber: {
    halo: "bg-[rgba(245,201,106,0.18)]",
    icon: "text-[var(--signal-amber)]",
    rail: "linear-gradient(90deg, var(--signal-amber), transparent)",
  },
  teal: {
    halo: "bg-[rgba(66,211,255,0.18)]",
    icon: "text-[var(--signal-aqua)]",
    rail: "linear-gradient(90deg, var(--signal-aqua), transparent)",
  },
  cyan: {
    halo: "bg-[rgba(155,140,255,0.18)]",
    icon: "text-[var(--signal-violet)]",
    rail: "linear-gradient(90deg, var(--signal-violet), transparent)",
  },
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = "emerald",
  suffix,
}: StatsCardProps) {
  const tone = toneMap[color];
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.round(value * progress));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.28 }}
      className="command-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-muted)]">{title}</p>
          <p className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white">
            {displayValue.toLocaleString()}
            {suffix}
          </p>
          {trend !== undefined ? (
            <p className={cn("mt-2 text-xs font-medium", trend >= 0 ? "text-[var(--signal-mint)]" : "text-[var(--signal-rose)]")}>
              {trend >= 0 ? "+" : "-"}
              {Math.abs(trend)}% versus prior window
            </p>
          ) : null}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8", tone.halo, tone.icon)}>
          {icon}
        </div>
      </div>
      <div className="mt-5 h-1.5 rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full" style={{ width: "100%", background: tone.rail }} />
      </div>
    </motion.div>
  );
}

interface CompletionRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function CompletionRing({
  value,
  size = 56,
  strokeWidth = 5,
  color = "text-[var(--signal-mint)]",
}: CompletionRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="text-white/8"
          stroke="currentColor"
          fill="transparent"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={color}
          stroke="currentColor"
          fill="transparent"
          strokeDasharray={circumference}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">{value}%</span>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  color = "from-[var(--signal-aqua)] to-[var(--signal-violet)]",
  showLabel = true,
  size = "md",
}: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2" };

  return (
    <div className="w-full">
      <div className={cn("w-full rounded-full bg-white/[0.06]", heights[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn("rounded-full bg-gradient-to-r", color, heights[size])}
        />
      </div>
      {showLabel ? <p className="mt-1 text-[11px] text-[var(--text-muted)]">{percent.toFixed(0)}%</p> : null}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

const badgeVariants = {
  default: "border-white/10 bg-white/[0.05] text-[var(--text-secondary)]",
  success: "border-[rgba(109,229,194,0.2)] bg-[rgba(109,229,194,0.1)] text-[var(--signal-mint)]",
  warning: "border-[rgba(245,201,106,0.22)] bg-[rgba(245,201,106,0.1)] text-[var(--signal-amber)]",
  error: "border-[rgba(255,124,149,0.22)] bg-[rgba(255,124,149,0.1)] text-[var(--signal-rose)]",
  info: "border-[rgba(66,211,255,0.22)] bg-[rgba(66,211,255,0.1)] text-[var(--signal-aqua)]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const buttonVariants = {
  primary: "bg-[var(--brand-gradient)] text-[#041019] shadow-[0_12px_30px_-18px_rgba(66,211,255,0.95)]",
  secondary: "border border-white/8 bg-white/[0.05] text-white hover:bg-white/[0.08]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white",
  danger: "border border-[rgba(255,124,149,0.22)] bg-[rgba(255,124,149,0.12)] text-[var(--signal-rose)] hover:bg-[rgba(255,124,149,0.16)]",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all",
        buttonVariants[variant],
        buttonSizes[size],
        (disabled || loading) && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-80" />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label ? <label className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</label> : null}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--text-subtle)]",
            "focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]",
            error && "border-[rgba(255,124,149,0.3)] focus:ring-[rgba(255,124,149,0.1)]",
            className
          )}
          {...props}
        />
        {error ? <p className="text-[11px] font-medium text-[var(--signal-rose)]">{error}</p> : null}
      </div>
    );
  }
);
Input.displayName = "Input";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

export function FormField({ label, children, error, required }: FormFieldProps) {
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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label ? <label className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</label> : null}
        <select
          ref={ref}
          className={cn(
            "w-full rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white",
            "focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

interface CardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
}

export function Card({ children, hover = true, className, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.25 }}
      className={cn("command-card", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}

const avatarSizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function Avatar({ name, src, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={cn("rounded-2xl object-cover", avatarSizes[size])} />;
  }

  return (
    <div className={cn("flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#9b8cff,#42d3ff)] font-semibold text-[#041019]", avatarSizes[size])}>
      {initials}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-xl", className)} />;
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right";
}

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  const positionClasses =
    side === "right"
      ? "left-full top-1/2 ml-3 -translate-y-1/2"
      : "bottom-full left-1/2 mb-2 -translate-x-1/2";

  return (
    <div className="group relative inline-block">
      {children}
      <div className={cn("pointer-events-none absolute z-50 opacity-0 transition-all duration-150 group-hover:opacity-100", positionClasses)}>
        <div className="whitespace-nowrap rounded-xl border border-white/8 bg-[rgba(8,12,22,0.94)] px-3 py-1.5 text-[11px] font-medium text-white shadow-2xl">
          {content}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 rounded-3xl border border-white/8 bg-white/[0.04] p-5 text-[var(--signal-aqua)]">{icon}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <span className="text-[var(--text-subtle)]">/</span> : null}
          {item.href ? (
            <a href={item.href} className="text-[var(--text-secondary)] transition-colors hover:text-white">
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-white">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function CardSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ["w-[90%]", "w-[78%]", "w-[66%]", "w-[54%]", "w-[42%]"];
  return (
    <div className={cn("rounded-[26px] border border-white/8 bg-white/[0.04] p-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="space-y-2.5 pt-3">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton key={index} className={cn("h-3", widths[index] || "w-1/2")} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({ cards = 6, columns = 3 }: { cards?: number; columns?: number }) {
  const colClass =
    columns === 2 ? "md:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28 rounded-2xl" />
      </div>
      <div className={`grid gap-5 ${colClass}`}>
        {Array.from({ length: cards }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/8 bg-white/[0.04]">
      <div className="border-b border-white/8 p-4">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-3" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/6">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, cellIndex) => {
                const widths = ["w-[75%]", "w-[85%]", "w-[70%]", "w-[90%]", "w-[80%]"];
                return <Skeleton key={cellIndex} className={cn("h-3", widths[cellIndex])} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-[26px] border border-white/8 bg-white/[0.04] p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-11 w-11 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
