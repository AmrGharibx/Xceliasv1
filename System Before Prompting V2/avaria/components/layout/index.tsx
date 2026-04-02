"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardList,
  Command,
  Crown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { openCommandPalette } from "@/components/search/CommandPalette";
import { Tooltip } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUIStore, useVisualModeStore } from "@/stores";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; color?: string }>;
  tone: string;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Command Center", shortLabel: "Home", icon: LayoutDashboard, tone: "var(--signal-aqua)" },
      { href: "/analytics", label: "Intelligence", shortLabel: "Intel", icon: BarChart3, tone: "var(--signal-violet)" },
    ],
  },
  {
    title: "Academy",
    items: [
      { href: "/batches", label: "Batches", shortLabel: "Batches", icon: GraduationCap, tone: "var(--signal-mint)" },
      { href: "/trainees", label: "Trainees", shortLabel: "Trainees", icon: Users, tone: "var(--signal-aqua)" },
      { href: "/companies", label: "Companies", shortLabel: "Companies", icon: Building2, tone: "var(--signal-amber)" },
      { href: "/assessments", label: "Assessments", shortLabel: "Assess", icon: ClipboardList, tone: "var(--signal-rose)" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/attendance/daily", label: "Daily Attendance", shortLabel: "Daily", icon: CalendarCheck, tone: "var(--signal-mint)" },
      { href: "/attendance/10-day", label: "10-Day Progress", shortLabel: "10-Day", icon: Calendar, tone: "var(--signal-aqua)" },
    ],
  },
];

const utilityItems: NavItem[] = [
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings, tone: "var(--text-muted)" },
];

const allItems = [...navSections.flatMap((section) => section.items), ...utilityItems];

function getActiveTitle(pathname: string) {
  const match =
    allItems.find((item) => pathname === item.href) ??
    allItems.find((item) => item.href !== "/" && pathname.startsWith(item.href));

  return match?.label ?? "Command Center";
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user, loading: authLoading } = useAuth();
  const initials = user
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AA";

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen, sidebarOpen]);

  const previousPath = React.useRef(pathname);
  React.useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  }, [pathname, setSidebarOpen]);

  return (
    <>
      <AnimatePresence>
        {sidebarOpen ? (
          <motion.button
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-40 bg-[#04070d]/70 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 288 : 92 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/6 bg-[linear-gradient(180deg,rgba(5,8,14,0.98),rgba(7,11,20,0.96))] backdrop-blur-2xl lg:relative",
          !sidebarOpen && "max-lg:-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,#42d3ff_0%,#0b6cff_42%,#09111d_100%)] shadow-[0_12px_40px_-18px_rgba(66,211,255,0.8)]">
              <Crown className="h-4.5 w-4.5 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="min-w-0"
                >
                  <p className="font-display text-base font-bold tracking-[0.08em] text-white">
                    Avaria Academy
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    Operations OS
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Link>

          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden rounded-2xl border border-white/8 bg-white/5 p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/8 hover:text-white lg:block"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>

        <div className="mx-5 mb-5 rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#9b8cff,#42d3ff)] text-sm font-semibold text-[#041019]">
              {initials}
            </div>
            <AnimatePresence>
              {sidebarOpen ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
                  {authLoading ? (
                    <>
                      <div className="h-3.5 w-28 animate-pulse rounded bg-white/10" />
                      <div className="mt-1.5 h-2.5 w-16 animate-pulse rounded bg-white/8" />
                    </>
                  ) : (
                    <>
                      <p className="truncate text-sm font-semibold text-white">{user?.name ?? "–"}</p>
                      <p className="truncate text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                        {user?.role ?? "–"}
                      </p>
                    </>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
            {sidebarOpen ? <ShieldCheck className="h-4 w-4 text-[var(--signal-mint)]" /> : null}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-5">
            {navSections.map((section) => (
              <div key={section.title}>
                <AnimatePresence>
                  {sidebarOpen ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mb-2 px-3 text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]"
                    >
                      {section.title}
                    </motion.p>
                  ) : null}
                </AnimatePresence>

                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    const content = (
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm transition-all duration-200",
                          active
                            ? "bg-[linear-gradient(135deg,rgba(66,211,255,0.18),rgba(155,140,255,0.16))] text-white shadow-[0_16px_40px_-22px_rgba(66,211,255,0.9)]"
                            : "text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        {active ? (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute inset-y-2 left-1 w-1 rounded-full bg-[linear-gradient(180deg,#42d3ff,#9b8cff)]"
                          />
                        ) : null}
                        <div
                          className={cn(
                            "relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04]",
                            active && "border-white/12 bg-white/[0.08]"
                          )}
                        >
                          <Icon className="h-4.5 w-4.5" style={{ color: active ? "white" : item.tone }} />
                        </div>
                        <AnimatePresence>
                          {sidebarOpen ? (
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8 }}
                              className="min-w-0"
                            >
                              <p className="truncate font-medium">{item.label}</p>
                              <p className="truncate text-[11px] uppercase tracking-[0.22em] text-white/45">
                                {section.title}
                              </p>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </Link>
                    );

                    return sidebarOpen ? (
                      <React.Fragment key={item.href}>{content}</React.Fragment>
                    ) : (
                      <Tooltip key={item.href} content={item.shortLabel} side="right">
                        {content}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/6 px-4 py-4">
          <div className="space-y-1.5">
            {utilityItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              const content = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all duration-200",
                    active ? "bg-white/[0.07] text-white" : "text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04]">
                    <Icon className="h-4.5 w-4.5" style={{ color: item.tone }} />
                  </div>
                  <AnimatePresence>
                    {sidebarOpen ? (
                      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}>
                        {item.label}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </Link>
              );

              return sidebarOpen ? (
                <React.Fragment key={item.href}>{content}</React.Fragment>
              ) : (
                <Tooltip key={item.href} content={item.shortLabel} side="right">
                  {content}
                </Tooltip>
              );
            })}
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const mode = useVisualModeStore((state) => state.mode);
  const toggleMode = useVisualModeStore((state) => state.toggleMode);
  const { logout, user } = useAuth();
  const [isMac, setIsMac] = React.useState(true);
  const activeTitle = getActiveTitle(pathname);

  React.useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-[rgba(5,8,14,0.72)] backdrop-blur-2xl">
      <div className="flex h-18 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
            className="rounded-2xl border border-white/8 bg-white/[0.04] p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white lg:hidden"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">Current surface</p>
            <h1 className="truncate font-display text-xl font-bold text-white">{activeTitle}</h1>
          </div>

          <button
            onClick={openCommandPalette}
            className="group relative hidden h-12 min-w-[280px] items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 text-left transition-colors hover:bg-white/[0.07] md:flex"
          >
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <Search className="h-4 w-4 text-[var(--signal-aqua)]" />
              <span>Search people, batches, actions</span>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <Command className="h-3 w-3" />
              <span>{isMac ? "K" : "Ctrl K"}</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 md:flex">
            <span className="h-2 w-2 rounded-full bg-[var(--signal-mint)] shadow-[0_0_16px_var(--signal-mint)]" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[var(--text-muted)]">System</p>
              <p className="text-xs font-medium text-white">Live and synchronized</p>
            </div>
          </div>

          <button
            onClick={toggleMode}
            aria-label="Toggle cinematic mode"
            className={cn(
              "rounded-2xl border p-2.5 transition-colors",
              mode === "cinematic"
                ? "border-[rgba(66,211,255,0.24)] bg-[rgba(66,211,255,0.12)] text-[var(--signal-aqua)]"
                : "border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-white"
            )}
          >
            <Sparkles className="h-4.5 w-4.5" />
          </button>

          <button
            aria-label="Notifications"
            onClick={() => {
              // TODO: Replace with notifications panel when ready
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("avaria:toast", { detail: { type: "info", title: "No new notifications", message: "All caught up." } }));
              }
            }}
            className="relative rounded-2xl border border-white/8 bg-white/[0.04] p-2.5 text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--signal-amber)] shadow-[0_0_12px_var(--signal-amber)]" />
          </button>

          <div className="hidden min-w-0 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 sm:block">
            <p className="truncate text-sm font-medium text-white">{user?.email ?? "operations@avaria"}</p>
            <p className="truncate text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{user?.role ?? "viewer"}</p>
          </div>

          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5 text-[var(--text-secondary)] transition-colors hover:bg-[rgba(255,92,136,0.12)] hover:text-[var(--signal-rose)]"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
