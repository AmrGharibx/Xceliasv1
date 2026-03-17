// ============================================================
// AVARIA ACADEMY — GLOBAL STATE STORE (ZUSTAND)
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeConfig, DashboardWidget } from "@/types";

// ============================================================
// THEME / CUSTOMIZATION STORE
// ============================================================

interface ThemeState {
  config: ThemeConfig;
  setConfig: (config: Partial<ThemeConfig>) => void;
  resetConfig: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const defaultThemeConfig: ThemeConfig = {
  primaryColor: "#10b981",
  accentColor: "#34d399",
  backgroundStyle: "gradient",
  cardStyle: "glass",
  animationSpeed: "normal",
  compactMode: false,
  showSparklines: true,
  chartStyle: "area",
  colorScheme: "cyan",
  fontFamily: "inter",
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      config: defaultThemeConfig,
      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      resetConfig: () => set({ config: defaultThemeConfig }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "avaria-academy-theme",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ============================================================
// DASHBOARD WIDGETS STORE
// ============================================================

interface DashboardState {
  widgets: DashboardWidget[];
  setWidgets: (widgets: DashboardWidget[]) => void;
  toggleWidget: (id: string) => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;
}

const defaultWidgets: DashboardWidget[] = [
  { id: "stats", type: "stats", title: "Quick Stats", visible: true, position: 0, size: "full" },
  { id: "attendance-hero", type: "chart", title: "Attendance Pulse", visible: true, position: 1, size: "lg" },
  { id: "live-feed", type: "feed", title: "Live Attendance Feed", visible: true, position: 2, size: "md" },
  { id: "attendance-trend", type: "chart", title: "Attendance Trend", visible: true, position: 3, size: "lg" },
  { id: "outcomes", type: "chart", title: "Assessment Outcomes", visible: true, position: 4, size: "md" },
  { id: "companies", type: "chart", title: "Top Companies", visible: true, position: 5, size: "md" },
  { id: "10day", type: "table", title: "10-Day Completion", visible: true, position: 6, size: "md" },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,
      setWidgets: (widgets) => set({ widgets }),
      toggleWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w
          ),
        })),
      reorderWidgets: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.widgets);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { widgets: result.map((w, i) => ({ ...w, position: i })) };
        }),
    }),
    {
      name: "avaria-academy-dashboard",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================================
// UI STATE STORE
// ============================================================

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: `notif-${Date.now()}` },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

// ============================================================
// VISUAL MODE STORE (PERFORMANCE vs CINEMATIC)
// ============================================================

export type VisualMode = "performance" | "cinematic";

interface VisualModeState {
  mode: VisualMode;
  setMode: (mode: VisualMode) => void;
  toggleMode: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useVisualModeStore = create<VisualModeState>()(
  persist(
    (set, get) => ({
      mode: "performance",
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === "cinematic" ? "performance" : "cinematic" }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "avaria-academy-visual-mode",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
