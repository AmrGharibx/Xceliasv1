"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Palette, Bell, Shield, Database, Eye, EyeOff } from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { Button, Card, Input, Select } from "@/components/ui";
import { CustomizationPanel } from "@/components/customization/CustomizationPanel";
import { useThemeStore } from "@/stores";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [customizationOpen, setCustomizationOpen] = React.useState(false);
  const [clearConfirm, setClearConfirm] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const { config, setConfig } = useThemeStore();
  const toast = useToast();
  const { user } = useAuth();

  /* Password change */
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Missing fields", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Too short", "Password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }
      toast.success("Password updated", "Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error("Error", e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  /* Notification prefs (persisted in localStorage) */
  const [notifPrefs, setNotifPrefs] = React.useState(() => {
    if (typeof window === "undefined") return { email: true, attendance: true, assessment: false };
    try {
      const stored = localStorage.getItem("avaria-notif-prefs");
      return stored ? JSON.parse(stored) : { email: true, attendance: true, assessment: false };
    } catch { return { email: true, attendance: true, assessment: false }; }
  });

  const toggleNotif = (key: string) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem("avaria-notif-prefs", JSON.stringify(updated));
    toast.success("Setting saved", `${key} notifications ${updated[key] ? "enabled" : "disabled"}.`);
  };

  /* Export all data */
  const handleExport = async () => {
    try {
      const res = await fetch("/api/export?type=all");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avaria-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported", "Your data has been downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Export failed", "Could not export data.");
    }
  };

  /* Import data */
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      toast.info("Importing...", `Processing ${file.name}`);

      try {
        // Determine file type from name
        let fileType = "trainees";
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes("batch")) fileType = "batches";
        else if (nameLower.includes("attend")) fileType = "attendance";
        else if (nameLower.includes("assess")) fileType = "assessments";
        else if (nameLower.includes("10-day") || nameLower.includes("tenday") || nameLower.includes("10day")) fileType = "tenday";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", fileType);

        const res = await fetch("/api/ingest", { method: "POST", body: formData });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Import failed" }));
          throw new Error(errData.error || "Import failed");
        }
        const result = await res.json();
        toast.success(
          "Import complete",
          `${result.summary?.new ?? 0} new, ${result.summary?.updated ?? 0} updated, ${result.summary?.skipped ?? 0} skipped`
        );
      } catch (err) {
        toast.error("Import failed", err instanceof Error ? err.message : "Could not process file.");
      }
    };
    input.click();
  };

  /* Clear data */
  const handleClear = async () => {
    setClearing(true);
    try {
      toast.warning("Data cleared", "All local preferences have been reset.");
      localStorage.removeItem("avaria-academy-theme");
      localStorage.removeItem("avaria-academy-dashboard");
      localStorage.removeItem("avaria-notif-prefs");
      setClearConfirm(false);
      window.location.reload();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl space-y-8"
          >
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-semibold text-[#fafaf9]">Settings</h1>
              <p className="text-sm text-[#57534e]">
                Manage your preferences and application settings
              </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
              {/* Appearance */}
              <Card className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-purple-500/15 p-2 text-purple-300">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#fafaf9]">Appearance</h2>
                    <p className="text-sm text-[#57534e]">
                      Customize the look and feel of your dashboard
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
                    <div>
                      <p className="font-medium text-[#ccd5e4]">Color Scheme</p>
                      <p className="text-sm text-[#57534e]">
                        Current: {config.colorScheme}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setCustomizationOpen(true)}
                    >
                      Customize
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
                    <div>
                      <p className="font-medium text-[#ccd5e4]">Background Style</p>
                      <p className="text-sm text-[#57534e]">
                        Current: {config.backgroundStyle}
                      </p>
                    </div>
                    <Select
                      options={[
                        { value: "gradient", label: "Gradient" },
                        { value: "solid", label: "Solid" },
                        { value: "mesh", label: "Mesh" },
                      ]}
                      value={config.backgroundStyle}
                      onChange={(e) => { setConfig({ backgroundStyle: e.target.value as "gradient" | "solid" | "mesh" }); toast.success("Updated", "Background style changed."); }}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
                    <div>
                      <p className="font-medium text-[#ccd5e4]">Animation Speed</p>
                      <p className="text-sm text-[#57534e]">
                        Control animation speed across the app
                      </p>
                    </div>
                    <Select
                      options={[
                        { value: "slow", label: "Slow" },
                        { value: "normal", label: "Normal" },
                        { value: "fast", label: "Fast" },
                      ]}
                      value={config.animationSpeed}
                      onChange={(e) => { setConfig({ animationSpeed: e.target.value as "slow" | "normal" | "fast" }); toast.success("Updated", "Animation speed changed."); }}
                    />
                  </div>
                </div>
              </Card>

              {/* Notifications */}
              <Card className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-amber-500/15 p-2 text-amber-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#fafaf9]">
                      Notifications
                    </h2>
                    <p className="text-sm text-[#57534e]">
                      Configure notification preferences
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ToggleSetting
                    label="Email Notifications"
                    description="Receive email alerts for important updates"
                    checked={notifPrefs.email}
                    onToggle={() => toggleNotif("email")}
                  />
                  <ToggleSetting
                    label="Attendance Alerts"
                    description="Get notified when attendance drops below threshold"
                    checked={notifPrefs.attendance}
                    onToggle={() => toggleNotif("attendance")}
                  />
                  <ToggleSetting
                    label="Assessment Reminders"
                    description="Reminder notifications for pending assessments"
                    checked={notifPrefs.assessment}
                    onToggle={() => toggleNotif("assessment")}
                  />
                </div>
              </Card>

              {/* Security */}
              <Card className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#fafaf9]">Security</h2>
                    <p className="text-sm text-[#57534e]">
                      Manage your account security settings
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
                    <p className="font-medium text-[#ccd5e4]">Change Password</p>
                    <p className="mb-1 text-sm text-[#57534e]">
                      Logged in as <span className="text-[#ccd5e4]">{user?.email ?? "..."}</span>
                    </p>
                    <p className="mb-4 text-sm text-[#57534e]">
                      Update your account password
                    </p>
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          type={showCurrent ? "text" : "password"}
                          placeholder="Current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534e] hover:text-[#ccd5e4]"
                          onClick={() => setShowCurrent(!showCurrent)}
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          type={showNew ? "text" : "password"}
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534e] hover:text-[#ccd5e4]"
                          onClick={() => setShowNew(!showNew)}
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      className="mt-4"
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                    >
                      {changingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>

                  <ToggleSetting
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                    checked={false}
                    onToggle={() => toast.info("Coming soon", "Two-factor authentication is not yet available.")}
                  />
                </div>
              </Card>

              {/* Data Management */}
              <Card className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-teal-500/15 p-2 text-sky-300">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#fafaf9]">
                      Data Management
                    </h2>
                    <p className="text-sm text-[#57534e]">
                      Export and manage your data
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
                    <div>
                      <p className="font-medium text-[#ccd5e4]">Export All Data</p>
                      <p className="text-sm text-[#57534e]">
                        Download all your data as CSV/Excel
                      </p>
                    </div>
                    <Button variant="secondary" onClick={handleExport}>Export</Button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
                    <div>
                      <p className="font-medium text-[#ccd5e4]">Import Data</p>
                      <p className="text-sm text-[#57534e]">
                        Import data from CSV/Excel files
                      </p>
                    </div>
                    <Button variant="secondary" onClick={handleImport}>Import</Button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <div>
                      <p className="font-medium text-rose-300">Reset Local Preferences</p>
                      <p className="text-sm text-[#57534e]">
                        Resets theme, dashboard layout, and notification preferences to defaults.
                      </p>
                    </div>
                    <Button variant="danger" onClick={() => setClearConfirm(true)}>Reset</Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>

      <CustomizationPanel
        open={customizationOpen}
        onClose={() => setCustomizationOpen(false)}
      />

      <ConfirmDialog
        open={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={handleClear}
        title="Reset Local Preferences"
        message="This will reset theme, dashboard layout, and notification preferences to their defaults. Your database data will not be affected."
        confirmLabel="Reset Preferences"
        loading={clearing}
      />
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
      <div>
        <p className="font-medium text-[#ccd5e4]">{label}</p>
        <p className="text-sm text-[#57534e]">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-emerald-500" : "bg-[#2c2724]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
