"use client";

import * as React from "react";
import { useVisualModeStore } from "@/stores";

export function VisualModeSync() {
  const mode = useVisualModeStore((s) => s.mode);

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.visualMode = mode;
    root.style.setProperty("--fxCinematic", mode === "cinematic" ? "1" : "0");
  }, [mode]);

  return null;
}
