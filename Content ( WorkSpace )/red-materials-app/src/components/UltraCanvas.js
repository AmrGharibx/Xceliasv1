import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sparkles as DreiSparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

export const UltraFallbackBg = () => (
  <div className="fixed inset-0 -z-50 overflow-hidden bg-[#09090b]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(173,46,33,0.20),transparent_36%),radial-gradient(circle_at_80%_25%,rgba(120,74,25,0.20),transparent_28%),linear-gradient(180deg,#070709_0%,#0b0b0f_38%,#060608_100%)]" />
    <div className="absolute inset-0 opacity-[0.09] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%220.45%22/></svg>')]" />
  </div>
);

const Monolith = ({ position, color, scale = 1 }) => {
  const ref = useRef(null);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: 0.16,
        metalness: 0.78,
        transmission: 0.12,
        thickness: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.18,
        envMapIntensity: 1.6,
      }),
    [color]
  );

  useFrame((state, delta) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.y += delta * 0.16;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.55 + position[0]) * 0.12;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.6} floatIntensity={0.45}>
      <mesh ref={ref} position={position} scale={scale} material={material}>
        <boxGeometry args={[0.8, 2.5, 0.7]} />
      </mesh>
    </Float>
  );
};

const RibbonField = ({ count = 1200 }) => {
  const ref = useRef(null);
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const a = new THREE.Color('#b33420');
    const b = new THREE.Color('#c69354');

    for (let index = 0; index < count; index += 1) {
      const t = index / count;
      const angle = t * Math.PI * 16;
      const radius = 2 + Math.sin(t * Math.PI * 5) * 0.75;
      pos[index * 3] = Math.cos(angle) * radius;
      pos[index * 3 + 1] = (t - 0.5) * 7;
      pos[index * 3 + 2] = Math.sin(angle) * radius;

      const mixed = a.clone().lerp(b, t);
      col[index * 3] = mixed.r;
      col[index * 3 + 1] = mixed.g;
      col[index * 3 + 2] = mixed.b;
    }

    return { positions: pos, colors: col };
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.y += delta * 0.04;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.07;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={colors.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} vertexColors transparent opacity={0.78} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const UltraCanvas = ({ reducedMotion = false }) => (
  <div className="fixed inset-0 -z-10">
    <Canvas dpr={reducedMotion ? [1, 1] : [1, 1.5]} camera={{ position: [0, 0.3, 7.5], fov: 50 }} gl={{ antialias: !reducedMotion, alpha: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#09090b']} />
      <fog attach="fog" args={['#09090b', 4.5, 17]} />

      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 7, 3]} intensity={1.05} color="#e76f51" />
      <pointLight position={[-4, -1, 2]} intensity={0.65} color="#a93428" />

      <Environment preset="warehouse" />
      <Stars radius={65} depth={26} count={reducedMotion ? 420 : 1100} factor={1.8} saturation={0} fade speed={0.32} />
      <DreiSparkles count={reducedMotion ? 18 : 48} speed={reducedMotion ? 0.06 : 0.22} size={reducedMotion ? 1.2 : 1.8} color="#d97745" />
      <RibbonField count={reducedMotion ? 360 : 760} />
      <Monolith position={[-2.4, -0.2, -1.4]} color="#9f2d20" scale={1.05} />
      <Monolith position={[2.3, 0.2, -1]} color="#c17a37" scale={0.92} />
      <Monolith position={[0, -1.2, -2.2]} color="#5d1215" scale={1.25} />
    </Canvas>

    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(179,52,32,0.18),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(193,122,55,0.10),transparent_55%)]" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,9,0.18),rgba(7,7,9,0.46),rgba(7,7,9,0.88))]" />
  </div>
);

export default UltraCanvas;