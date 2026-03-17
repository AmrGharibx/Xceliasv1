import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { motion, useScroll } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import { Building2 } from 'lucide-react';

import { ChapterMapDrawer, ProgressBar, TopNavigation } from './components/Navigation';
import QuickReferenceDrawer from './components/QuickReferenceDrawer';
import SourceDeckDrawer from './components/SourceDeckDrawer';
import { ErrorBoundary, UltraFallbackBg } from './components/UltraCanvas';
import { SkipLink } from './components/ui';
import { NAV_ITEMS } from './data/content';
import HeroSection from './sections/HeroSection';
import InventorySection from './sections/InventorySection';
import MarketSection from './sections/MarketSection';
import RequestSection from './sections/RequestSection';
import PsychologySection from './sections/PsychologySection';
import ArsenalSection from './sections/ArsenalSection';
import CallsSection from './sections/CallsSection';
import MasterySection from './sections/MasterySection';

const UltraCanvas = lazy(() => import('./components/UltraCanvas'));

const ParticleField = ({ reducedEffects = false }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: reducedEffects ? 12 : 24 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * (reducedEffects ? 2 : 3) + 1,
        delay: Math.random() * 3,
        duration: Math.random() * (reducedEffects ? 10 : 18) + (reducedEffects ? 18 : 16),
      })),
    [reducedEffects]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-[rgba(198,147,84,0.22)]"
          style={{ left: `${particle.left}%`, top: `${particle.top}%`, width: particle.size, height: particle.size }}
          animate={reducedEffects ? { opacity: [0.08, 0.22, 0.08] } : { y: [0, -70, 0], opacity: [0.12, 0.6, 0.12] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

const Footer = () => (
  <footer className="border-t border-white/10 bg-black/35 px-5 py-12 md:px-8 lg:px-12">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] shadow-[0_16px_40px_rgba(127,22,22,0.35)]">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Red Materials</div>
          <div className="text-sm text-[var(--text-soft)]">Immersive real-estate sales mastery</div>
        </div>
      </div>
      <p className="max-w-xl text-sm leading-6 text-[var(--text-muted)]">Designed as a premium learning system with the original training transcript preserved in-product and a dedicated quick-reference layer for repeat use.</p>
    </div>
  </footer>
);

const App = () => {
  const { scrollYProgress } = useScroll();
  const [activeSection, setActiveSection] = useState('hero');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enableCanvas, setEnableCanvas] = useState(false);
  const [reducedEffects, setReducedEffects] = useState(false);
  const modalOpen = sourceOpen || mapOpen || briefingOpen;

  const openMap = () => {
    setSourceOpen(false);
    setBriefingOpen(false);
    setMapOpen(true);
  };

  const openBriefing = () => {
    setSourceOpen(false);
    setMapOpen(false);
    setBriefingOpen(true);
  };

  const openSource = () => {
    setMapOpen(false);
    setBriefingOpen(false);
    setSourceOpen(true);
  };

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(Boolean(media.matches));
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const smallScreen = window.matchMedia('(max-width: 1024px)').matches;
    const lowMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory <= 4 : false;
    const lowCpu = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency <= 4 : false;
    setReducedEffects(reducedMotion || coarsePointer || smallScreen || lowMemory || lowCpu);
  }, [reducedMotion]);

  useEffect(() => {
    const id = window.setTimeout(() => setEnableCanvas(true), reducedEffects ? 900 : 450);
    return () => window.clearTimeout(id);
  }, [reducedEffects]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: reducedEffects ? 0.72 : 0.92,
      smoothWheel: !reducedEffects,
      smoothTouch: false,
      touchMultiplier: reducedEffects ? 1 : 1.08,
    });

    window.__RED_MATERIALS_LENIS = lenis;

    let frame = 0;
    const animate = (time) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      delete window.__RED_MATERIALS_LENIS;
      lenis.destroy();
    };
  }, [reducedEffects]);

  useEffect(() => {
    if (reducedEffects || modalOpen) {
      return undefined;
    }

    let frame = 0;
    const handleMouseMove = (event) => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth) * 100;
        const y = (event.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty('--mx', `${x}%`);
        document.documentElement.style.setProperty('--my', `${y}%`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [modalOpen, reducedEffects]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;
      for (const item of NAV_ITEMS) {
        const element = document.getElementById(item.id);
        if (!element) {
          continue;
        }
        const { offsetTop, offsetHeight } = element;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-white selection:bg-[rgba(102,126,234,0.3)] selection:text-white">
      <style>
        {`
          :root {
            --mx: 50%;
            --my: 50%;
            --bg: #0f0f1a;
            --panel: rgba(255,255,255,0.06);
            --panel-strong: rgba(102,126,234,0.14);
            --accent: #667eea;
            --accent-strong: #764ba2;
            --accent-soft: #f093fb;
            --gold: #f093fb;
            --line: rgba(102,126,234,0.34);
            --text-soft: #e8e8f0;
            --text-muted: #9898b8;
          }
        `}
      </style>

      <SkipLink />
      <UltraFallbackBg />
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          {enableCanvas && !reducedEffects && !modalOpen ? <UltraCanvas reducedMotion={reducedEffects} /> : null}
        </Suspense>
      </ErrorBoundary>
      {!modalOpen ? <ParticleField reducedEffects={reducedEffects} /> : null}
      <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
        <div className={`absolute inset-0 ${reducedEffects ? 'bg-[radial-gradient(900px_circle_at_50%_18%,rgba(255,255,255,0.04),transparent_54%)]' : 'bg-[radial-gradient(900px_circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,0.07),transparent_48%)]'}`} />
        <div className={`absolute inset-0 ${reducedEffects ? 'bg-[radial-gradient(1200px_circle_at_50%_18%,rgba(102,126,234,0.08),transparent_62%)]' : 'bg-[radial-gradient(1200px_circle_at_var(--mx,50%)_var(--my,50%),rgba(102,126,234,0.12),transparent_58%)]'}`} />
      </div>

      <ProgressBar progress={scrollYProgress} />
      <TopNavigation
        activeSection={activeSection}
        onOpenMap={openMap}
        onOpenSource={openSource}
        onOpenBriefing={openBriefing}
        mapOpen={mapOpen}
        sourceOpen={sourceOpen}
        briefingOpen={briefingOpen}
      />

      <main id="main-content" className="relative z-10">
        <HeroSection onOpenSource={openSource} onOpenMap={openMap} />
        <InventorySection />
        <MarketSection />
        <RequestSection />
        <PsychologySection />
        <ArsenalSection />
        <CallsSection />
        <MasterySection onOpenSource={openSource} />
      </main>

      <Footer />

      <ChapterMapDrawer open={mapOpen} activeSection={activeSection} onClose={() => setMapOpen(false)} />
      <QuickReferenceDrawer open={briefingOpen} onClose={() => setBriefingOpen(false)} />
      <SourceDeckDrawer open={sourceOpen} onClose={() => setSourceOpen(false)} />
    </div>
  );
};

export default App;
