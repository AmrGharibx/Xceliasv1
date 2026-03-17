"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { useVisualModeStore } from "@/stores";

export function RouteFx() {
  const pathname = usePathname();
  const barRef = React.useRef<HTMLDivElement>(null);
  const cinematic = useVisualModeStore((s) => s.mode === "cinematic");

  React.useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.killTweensOf(bar);
    gsap.set(bar, { scaleX: 0, opacity: 0, transformOrigin: "0% 50%" });

    const tl = gsap.timeline();
    tl.to(bar, { opacity: 1, duration: 0.08, ease: "power1.out" })
      .to(bar, { scaleX: 0.78, duration: 0.35, ease: "power2.out" })
      .to(bar, { scaleX: 1, duration: 0.25, ease: "power2.out" })
      .to(bar, { opacity: 0, duration: 0.25, ease: "power1.out" }, ">-0.05");

    return () => { tl.kill(); };
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70]">
      <div
        ref={barRef}
        className={
          cinematic
            ? "h-[3px] w-full bg-gradient-to-r from-emerald-600 via-teal-400 to-pink-500 shadow-[0_0_28px_rgba(16,185,129,0.65)]"
            : "h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-pink-400 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
        }
      />
    </div>
  );
}
