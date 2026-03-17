"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { useVisualModeStore } from "@/stores";

const ThreeBackdrop = dynamic(
  () => import("@/components/visuals/ThreeBackdrop").then((m) => m.ThreeBackdrop),
  { ssr: false }
);

export function GlobalFx() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const mode = useVisualModeStore((s) => s.mode);
  const cinematic = mode === "cinematic";

  React.useEffect(() => {
    if (!rootRef.current) return;
    const el = rootRef.current;
    gsap.set(el, { "--fxPulse": 0 } as unknown as gsap.TweenVars);

    const tween = gsap.to(el, {
      "--fxPulse": 1,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    return () => { tween.kill(); };
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        filter: cinematic
          ? "saturate(calc(1.12 + var(--fxPulse) * 0.12)) brightness(calc(1.01 + var(--fxPulse) * 0.06)) contrast(1.01)"
          : "saturate(calc(1.04 + var(--fxPulse) * 0.06)) brightness(calc(1.0 + var(--fxPulse) * 0.03))",
      }}
    >
      {cinematic && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.10),transparent_55%)] blur-2xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.06),transparent_60%)] blur-3xl" />
        </div>
      )}
      <ThreeBackdrop />
    </div>
  );
}
