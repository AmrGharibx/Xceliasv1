import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { GlobalFx } from "@/components/visuals/GlobalFx";
import { RouteFx } from "@/components/visuals/RouteFx";
import { CommandPalette } from "@/components/search/CommandPalette";
import { VisualModeSync } from "@/components/visuals/VisualModeSync";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/hooks/useAuth";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avaria Academy · Operations OS",
  description:
    "Avaria Academy Operations OS unifies batches, attendance, assessments, and operational intelligence.",
  icons: {
    icon: "/icon.svg",
  },
  other: {
    "theme-color": "#080b12",
  },
  openGraph: {
    title: "Avaria Academy · Operations OS",
    description: "Run academy operations through a unified system for training throughput, attendance, readiness, and intelligence.",
    type: "website",
    siteName: "Avaria Academy",
  },
  twitter: {
    card: "summary",
    title: "Avaria Academy · Operations OS",
    description: "Run academy operations through a unified system for training throughput, attendance, readiness, and intelligence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} ${grotesk.variable} ${jetbrains.variable} antialiased noise-overlay`}
      >
        <VisualModeSync />
        <GlobalFx />
        <RouteFx />
        <AuthProvider>
          <CommandPalette />
          <ToastProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
