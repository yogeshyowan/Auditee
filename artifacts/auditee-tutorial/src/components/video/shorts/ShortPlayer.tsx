import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { ModuleKey } from '@/lib/demoUseCases';
import { SHORT_HOOKS, MODULE_ORDER } from '@/lib/shortsConfig';
import { BackgroundMusic } from '../BackgroundMusic';
import { ShortHook } from './ShortHook';
import { ShortCTA } from './ShortCTA';
import { ModuleSources } from '../modules/ModuleSources';
import { ModuleInterview } from '../modules/ModuleInterview';
import { ModuleRequirements } from '../modules/ModuleRequirements';
import { ModuleGaps } from '../modules/ModuleGaps';
import { ModuleTraceability } from '../modules/ModuleTraceability';
import { ModuleCompliance } from '../modules/ModuleCompliance';
import { ModuleCapa } from '../modules/ModuleCapa';
import { ModuleDefects } from '../modules/ModuleDefects';
import { ModuleTests } from '../modules/ModuleTests';
import { ModuleReports } from '../modules/ModuleReports';
import { ModuleWorkflows } from '../modules/ModuleWorkflows';
import { ModuleAnalytics } from '../modules/ModuleAnalytics';
import { ModuleRecurringAudits } from '../modules/ModuleRecurringAudits';
import { ModuleDashboard } from '../modules/ModuleDashboard';

const MODULES: Record<ModuleKey, React.ComponentType> = {
  dashboard: ModuleDashboard,
  sources: ModuleSources,
  interview: ModuleInterview,
  requirements: ModuleRequirements,
  gaps: ModuleGaps,
  traceability: ModuleTraceability,
  compliance: ModuleCompliance,
  capa: ModuleCapa,
  defects: ModuleDefects,
  tests: ModuleTests,
  reports: ModuleReports,
  workflows: ModuleWorkflows,
  analytics: ModuleAnalytics,
  'recurring-audits': ModuleRecurringAudits,
};

const HOOK_MS = 5000;
const MODULE_MS = 23000;
const CTA_MS = 10000;
const TOTAL_MS = HOOK_MS + MODULE_MS + CTA_MS;

type Phase = 'hook' | 'module' | 'cta' | 'done';

function getPhase(elapsedMs: number): Phase {
  if (elapsedMs < HOOK_MS) return 'hook';
  if (elapsedMs < HOOK_MS + MODULE_MS) return 'module';
  if (elapsedMs < TOTAL_MS) return 'cta';
  return 'done';
}

export function ShortPlayer({ slug, autoLoop = true, onComplete }: {
  slug: ModuleKey;
  autoLoop?: boolean;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('hook');
  const hook = SHORT_HOOKS[slug];
  const Module = MODULES[slug];

  useEffect(() => {
    let start = performance.now();
    let raf = 0;
    let done = false;
    const tick = () => {
      const raw = performance.now() - start;
      if (raw >= TOTAL_MS) {
        if (autoLoop) {
          start = performance.now();
          onComplete?.();
        } else if (!done) {
          done = true;
          setPhase('done');
          onComplete?.();
          return;
        }
      }
      const elapsed = autoLoop ? raw % TOTAL_MS : raw;
      const next = getPhase(elapsed);
      setPhase((curr) => (curr !== next ? next : curr));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [slug, autoLoop, onComplete]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden text-white">
      <BackgroundMusic />
      <AnimatePresence mode="wait">
        {phase === 'hook' && <ShortHook hook={hook} key="hook" />}
        {phase === 'module' && (
          <div key="module" className="absolute inset-0">
            <Module />
          </div>
        )}
        {phase === 'cta' && <ShortCTA hook={hook} key="cta" />}
      </AnimatePresence>

      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full transition-all duration-150 ease-linear"
          style={{
            background: hook.accent,
            width: `${
              ((MODULE_ORDER.indexOf(slug) + 1) / MODULE_ORDER.length) * 100
            }%`,
          }}
        />
      </div>

      {/* Top-right brand badge */}
      <div className="absolute top-3 right-3 z-50 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[2.8vw] font-bold tracking-wide">
        Auditee · #{MODULE_ORDER.indexOf(slug) + 1}/{MODULE_ORDER.length}
      </div>
    </div>
  );
}

/**
 * 9:16 vertical container — content scales to fill any viewport while
 * maintaining short-form aspect ratio (perfect for screen recording for
 * YouTube Shorts, Instagram Reels, TikTok).
 */
export function ShortFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
      <div
        className="relative bg-slate-950"
        style={{
          aspectRatio: '9 / 16',
          height: '100vh',
          maxHeight: '100vh',
          width: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
