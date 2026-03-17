"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import type { Mesh, Points, BufferGeometry, NormalBufferAttributes } from "three";
import * as THREE from "three";
import { useVisualModeStore } from "@/stores";

/* ─────────────────────────────────────────────────────────────
   AURORA PARTICLE NEBULA — flowing particle streams that
   create a living aurora borealis effect in 3D space
   ───────────────────────────────────────────────────────────── */

function AuroraParticles({ count = 800 }: { count?: number }) {
  const pointsRef = React.useRef<Points<BufferGeometry<NormalBufferAttributes>>>(null);
  const cinematic = useVisualModeStore((s) => s.mode === "cinematic");
  const particleCount = cinematic ? count : Math.floor(count * 0.4);

  const { positions, velocities, colors } = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    // Aurora palette: emerald, teal, pink, gold
    const palette = [
      [0.063, 0.725, 0.506],  // #10b981 emerald
      [0.204, 0.827, 0.6],    // #34d399 mint
      [0.024, 0.714, 0.831],  // #06b6d4 cyan
      [0.925, 0.282, 0.6],    // #ec4899 pink
      [0.961, 0.620, 0.043],  // #f59e0b amber
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Spread in a wide torus/ribbon shape
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 1.2;
      const radius = 2.5 + Math.random() * 3;

      pos[i3] = Math.cos(theta) * radius * Math.cos(phi);
      pos[i3 + 1] = Math.sin(phi) * 1.5 + (Math.random() - 0.5) * 0.8;
      pos[i3 + 2] = Math.sin(theta) * radius * Math.cos(phi);

      // Slow orbital velocity + vertical drift
      vel[i3] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.003;

      // Random color from palette
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i3] = c[0];
      col[i3 + 1] = c[1];
      col[i3 + 2] = c[2];
    }

    return { positions: pos, velocities: vel, colors: col };
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posArr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Orbital flow + sine wave undulation
      posArr[i3] += velocities[i3] + Math.sin(t * 0.2 + i * 0.01) * 0.001;
      posArr[i3 + 1] += velocities[i3 + 1] + Math.cos(t * 0.15 + i * 0.02) * 0.0008;
      posArr[i3 + 2] += velocities[i3 + 2] + Math.sin(t * 0.18 + i * 0.015) * 0.001;

      // Soft boundary — wrap particles back
      const dist = Math.sqrt(posArr[i3] ** 2 + posArr[i3 + 2] ** 2);
      if (dist > 6) {
        posArr[i3] *= 0.3;
        posArr[i3 + 2] *= 0.3;
      }
      if (Math.abs(posArr[i3 + 1]) > 2.5) {
        posArr[i3 + 1] *= 0.3;
      }
    }

    geo.attributes.position.needsUpdate = true;
    // Slow overall rotation
    pointsRef.current.rotation.y = t * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        size={cinematic ? 0.025 : 0.018}
        vertexColors
        transparent
        opacity={cinematic ? 0.7 : 0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMERALD ORB — central pulsing dodecahedron with iridescence
   ───────────────────────────────────────────────────────────── */
function EmeraldOrb() {
  const ref = React.useRef<Mesh>(null);
  const cinematic = useVisualModeStore((s) => s.mode === "cinematic");

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Breathing scale + slow tumble
    ref.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.05);
    ref.current.rotation.y = t * 0.08;
    ref.current.rotation.x = Math.sin(t * 0.3) * 0.1;
  });

  return (
    <Float speed={0.5} rotationIntensity={0.08} floatIntensity={0.15}>
      <mesh ref={ref}>
        <dodecahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial
          color="#059669"
          emissive="#10b981"
          emissiveIntensity={cinematic ? 1.0 : 0.5}
          roughness={0.1}
          metalness={0.9}
          wireframe={!cinematic}
        />
      </mesh>
      {/* Inner glow sphere */}
      {cinematic && (
        <mesh>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshBasicMaterial
            color="#34d399"
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      )}
    </Float>
  );
}

/* ─────────────────────────────────────────────────────────────
   ORBITAL RINGS — emerald + magenta double helix
   ───────────────────────────────────────────────────────────── */
function OrbitalRing({ radius = 1.6, color = "#10b981", speed = 0.06 }: { radius?: number; color?: string; speed?: number }) {
  const ref = React.useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * speed;
    ref.current.rotation.x += delta * speed * 0.5;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.006, 16, 120]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.0}
        transparent
        opacity={0.5}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────────────
   PARALLAX CAMERA RIG — mouse-responsive camera movement
   ───────────────────────────────────────────────────────────── */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  useFrame((state) => {
    const mx = state.mouse.x;
    const my = state.mouse.y;
    state.camera.position.x += (mx * 0.15 - state.camera.position.x) * 0.025;
    state.camera.position.y += (my * 0.1 - state.camera.position.y) * 0.025;
    state.camera.lookAt(0, 0, 0);
  });
  return <>{children}</>;
}

/* ─────────────────────────────────────────────────────────────
   MAIN THREE.JS BACKDROP
   ───────────────────────────────────────────────────────────── */
export function ThreeBackdrop() {
  const cinematic = useVisualModeStore((s) => s.mode === "cinematic");

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* Gradient underlays — warm charcoal with aurora tints */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_55%)]" />
      <div className="absolute inset-x-0 top-[-260px] h-[620px] bg-[radial-gradient(circle,rgba(52,211,153,0.06),transparent_60%)] blur-3xl" />
      {cinematic && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(236,72,153,0.05),transparent_50%)] blur-2xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.06),transparent_50%)] blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.03),transparent_40%)] blur-3xl" />
        </>
      )}

      {/* 3D Scene */}
      <div className="absolute inset-0 opacity-[0.45]">
        <Canvas
          dpr={cinematic ? [1.25, 2] : [1, 1.35]}
          camera={{ position: [0, 0, 4.5], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={cinematic ? 0.3 : 0.2} />
          <directionalLight position={[3, 2, 5]} intensity={cinematic ? 1.0 : 0.7} color="#34d399" />
          <directionalLight position={[-3, -1, -4]} intensity={cinematic ? 0.4 : 0.25} color="#ec4899" />
          <pointLight position={[0, 2, 2]} intensity={cinematic ? 0.5 : 0.25} color="#10b981" distance={10} />
          <pointLight position={[-2, -1, 1]} intensity={cinematic ? 0.3 : 0.15} color="#f59e0b" distance={8} />

          <ParallaxRig>
            {/* Aurora particle nebula */}
            <AuroraParticles count={cinematic ? 1000 : 400} />

            {/* Sparkle field */}
            <Sparkles
              count={cinematic ? 200 : 60}
              speed={cinematic ? 0.2 : 0.12}
              opacity={cinematic ? 0.5 : 0.2}
              scale={[8, 5, 4]}
              size={cinematic ? 1.2 : 0.8}
              color="#34d399"
            />
            {cinematic && (
              <Sparkles count={50} speed={0.08} opacity={0.2} scale={[6, 4, 3]} size={2.0} color="#ec4899" />
            )}

            {/* Central orb */}
            <EmeraldOrb />

            {/* Double helix orbital rings */}
            <OrbitalRing radius={1.4} color="#10b981" speed={0.06} />
            <OrbitalRing radius={1.8} color="#ec4899" speed={-0.04} />
            {cinematic && <OrbitalRing radius={2.3} color="#f59e0b" speed={0.03} />}
          </ParallaxRig>
        </Canvas>
      </div>

      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E)",
        }}
      />
    </div>
  );
}
