import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MODULE_ORDER } from '@/lib/shortsConfig';
import type { ModuleKey } from '@/lib/demoUseCases';
import { BackgroundMusic } from '../BackgroundMusic';
import { FullHookScene, FullIntroScene, ChapterTitle, FullClosureScene } from './FullScenes';
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

const HOOK_MS = 8000;
const INTRO_MS = 10000;
const CHAPTER_MS = 4000;
const MODULE_MS = 23000;
const CLOSURE_MS = 12000;

type Cue =
  | { kind: 'hook' }
  | { kind: 'intro' }
  | { kind: 'chapter'; slug: ModuleKey; index: number }
  | { kind: 'module'; slug: ModuleKey; index: number }
  | { kind: 'closure' };

function buildTimeline(): { cue: Cue; startMs: number; endMs: number }[] {
  const out: { cue: Cue; startMs: number; endMs: number }[] = [];
  let t = 0;
  out.push({ cue: { kind: 'hook' }, startMs: t, endMs: t + HOOK_MS }); t += HOOK_MS;
  out.push({ cue: { kind: 'intro' }, startMs: t, endMs: t + INTRO_MS }); t += INTRO_MS;
  MODULE_ORDER.forEach((slug, index) => {
    out.push({ cue: { kind: 'chapter', slug, index }, startMs: t, endMs: t + CHAPTER_MS }); t += CHAPTER_MS;
    out.push({ cue: { kind: 'module', slug, index }, startMs: t, endMs: t + MODULE_MS }); t += MODULE_MS;
  });
  out.push({ cue: { kind: 'closure' }, startMs: t, endMs: t + CLOSURE_MS });
  return out;
}

const TIMELINE = buildTimeline();
const TOTAL_MS = TIMELINE[TIMELINE.length - 1].endMs;

export function FullVideoPlayer() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - start) % TOTAL_MS;
      let i = 0;
      while (i < TIMELINE.length - 1 && TIMELINE[i].endMs <= elapsed) i++;
      setIdx((curr) => (curr !== i ? i : curr));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const current = TIMELINE[idx].cue;
  const elapsedTotal = TIMELINE[idx].startMs;
  const progressPct = (elapsedTotal / TOTAL_MS) * 100;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white">
      <BackgroundMusic />

      <AnimatePresence mode="wait">
        {current.kind === 'hook' && <FullHookScene key="hook" />}
        {current.kind === 'intro' && <FullIntroScene key="intro" />}
        {current.kind === 'chapter' && (
          <ChapterTitle key={`ch-${current.slug}`} index={current.index} slug={current.slug} />
        )}
        {current.kind === 'module' && (() => {
          const M = MODULES[current.slug];
          return <div key={`mod-${current.slug}`} className="absolute inset-0"><M /></div>;
        })()}
        {current.kind === 'closure' && <FullClosureScene key="closure" />}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-gradient-to-r from-violet-400 to-sky-400 transition-all duration-150 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Chapter index badge */}
      <div className="absolute top-3 right-3 z-50 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[0.8vw] font-bold tracking-wide">
        Auditee · Full Demo Tour
      </div>
    </div>
  );
}
