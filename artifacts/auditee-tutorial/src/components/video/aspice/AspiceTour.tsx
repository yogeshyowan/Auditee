import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import type { ModuleKey } from '@/lib/demoUseCases';
import { ModuleSources } from '../modules/ModuleSources';
import { ModuleInterview } from '../modules/ModuleInterview';
import { ModuleRequirements } from '../modules/ModuleRequirements';
import { ModuleGaps } from '../modules/ModuleGaps';
import { ModuleDefects } from '../modules/ModuleDefects';
import { ModuleCompliance } from '../modules/ModuleCompliance';
import { ModuleTraceability } from '../modules/ModuleTraceability';
import { ModuleCapa } from '../modules/ModuleCapa';
import { ModuleWorkflows } from '../modules/ModuleWorkflows';
import { ModulePdlc } from '../modules/ModulePdlc';
import { ModuleReports } from '../modules/ModuleReports';
import { ModuleRecurringAudits } from '../modules/ModuleRecurringAudits';
import { ModuleAnalytics } from '../modules/ModuleAnalytics';
import {
  AspiceHookScene,
  AspiceChapterTitle,
  EnterpriseScene,
  AspiceClosure,
} from './AspiceScenes';

type TourStep = {
  slug: ModuleKey;
  title: string;
  label: string;
  Component: React.ComponentType;
};

/** User-defined narrative order for the ASPICE walkthrough. */
const STEPS: TourStep[] = [
  { slug: 'sources',          title: 'Connect the brief and the toolchain',
    label: 'Drop the BRS PDF, plug in GitHub, Jira, IBM DOORS — Apollo ingests 184 reqs in seconds.',
    Component: ModuleSources },
  { slug: 'interview',        title: 'Find missing requirements with Smart Interview',
    label: 'Auditee asks the Apollo PM 12 ASPICE-aware questions and turns each answer into a real BRS.',
    Component: ModuleInterview },
  { slug: 'requirements',     title: 'Generate and baseline requirements',
    label: '192 BMS reqs drafted, tagged ISO 26262 ASIL-C and ASPICE 4.0, baselined as v1.',
    Component: ModuleRequirements },
  { slug: 'gaps',             title: 'Run AI gap detection',
    label: 'Scan code against the baseline. Surface untraced files, missing tests, unmitigated hazards.',
    Component: ModuleGaps },
  { slug: 'defects',          title: 'Pull defects from your defect tool',
    label: 'Jira, Bugzilla and ServiceNow defects sync every 5 minutes — auto-linked to req and test.',
    Component: ModuleDefects },
  { slug: 'compliance',       title: 'Run an audit and read live compliance scores',
    label: 'AI auditor scores Apollo against ISO 26262, 21434, UN R155 — every finding cited to evidence.',
    Component: ModuleCompliance },
  { slug: 'traceability',     title: 'Walk the bidirectional traceability graph',
    label: 'PRD-014 → ladder logic → 3 unit tests → 2 integration tests → zero open defects, fully linked.',
    Component: ModuleTraceability },
  { slug: 'capa',             title: 'Inject a CAPA from an audit gap',
    label: 'One click turns the SUP.10 finding into CAPA-022 — owner, due date, evidence pre-filled.',
    Component: ModuleCapa },
  { slug: 'workflows',        title: 'Follow up CAPAs with workflows',
    label: 'Open → In Progress → In Review → Verified Closed. Every transition gated, signed, audit-trailed.',
    Component: ModuleWorkflows },
  { slug: 'pdlc',             title: 'Monitor PDLC progress live',
    label: 'Six gated stages — Ideation, Design, Dev, Test, Launch, Governance — blockers and gate signers visible.',
    Component: ModulePdlc },
  { slug: 'reports',          title: 'Generate the AI audit report',
    label: '247-page ASPICE assessment in 4 minutes — every claim sourced from live requirements, code and tests.',
    Component: ModuleReports },
  { slug: 'recurring-audits', title: 'Schedule routine compliance audits',
    label: 'Daily ASIL checks, weekly cybersecurity reviews, monthly ASPICE roll-up — findings auto-open as CAPAs.',
    Component: ModuleRecurringAudits },
  { slug: 'analytics',        title: 'Read workflow analytics',
    label: 'Audit Readiness, Coverage, CAPA Closure, Traceability — sparkline trends, exportable as a board pack.',
    Component: ModuleAnalytics },
];

const HOOK_MS = 9000;
const CHAPTER_MS = 4500;
const MODULE_MS = 23000; // matches every module's internal TOTAL_MS
const ENTERPRISE_MS = 18000;
const CLOSURE_MS = 12000;

type Cue =
  | { kind: 'hook' }
  | { kind: 'chapter'; index: number }
  | { kind: 'module'; index: number }
  | { kind: 'enterprise' }
  | { kind: 'closure' };

function buildTimeline(): { cue: Cue; startMs: number; endMs: number }[] {
  const out: { cue: Cue; startMs: number; endMs: number }[] = [];
  let t = 0;
  out.push({ cue: { kind: 'hook' }, startMs: t, endMs: t + HOOK_MS }); t += HOOK_MS;
  STEPS.forEach((_, index) => {
    out.push({ cue: { kind: 'chapter', index }, startMs: t, endMs: t + CHAPTER_MS }); t += CHAPTER_MS;
    out.push({ cue: { kind: 'module', index }, startMs: t, endMs: t + MODULE_MS });   t += MODULE_MS;
  });
  out.push({ cue: { kind: 'enterprise' }, startMs: t, endMs: t + ENTERPRISE_MS }); t += ENTERPRISE_MS;
  out.push({ cue: { kind: 'closure' },    startMs: t, endMs: t + CLOSURE_MS });
  return out;
}

const TIMELINE = buildTimeline();
const TOTAL_MS = TIMELINE[TIMELINE.length - 1].endMs;
const TOTAL_STEPS = STEPS.length;

export function AspiceTour() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    const start = performance.now() - elapsedRef.current;
    const tick = () => {
      const elapsed = (performance.now() - start) % TOTAL_MS;
      elapsedRef.current = elapsed;
      let i = 0;
      while (i < TIMELINE.length - 1 && TIMELINE[i].endMs <= elapsed) i++;
      setIdx((curr) => (curr !== i ? i : curr));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const current = TIMELINE[idx].cue;
  const elapsedTotal = TIMELINE[idx].startMs;
  const progressPct = (elapsedTotal / TOTAL_MS) * 100;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white">
      <AnimatePresence mode="wait">
        {current.kind === 'hook' && <AspiceHookScene key="aspice-hook" />}
        {current.kind === 'chapter' && (() => {
          const step = STEPS[current.index];
          return (
            <AspiceChapterTitle
              key={`ch-${current.index}-${step.slug}`}
              index={current.index + 1}
              total={TOTAL_STEPS}
              slug={step.slug}
              stepTitle={step.title}
              stepLabel={step.label}
            />
          );
        })()}
        {current.kind === 'module' && (() => {
          const step = STEPS[current.index];
          const M = step.Component;
          return (
            <div key={`mod-${current.index}-${step.slug}`} className="absolute inset-0">
              <M />
            </div>
          );
        })()}
        {current.kind === 'enterprise' && <EnterpriseScene key="enterprise" />}
        {current.kind === 'closure' && <AspiceClosure key="closure" />}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-gradient-to-r from-violet-400 to-sky-400 transition-all duration-150 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Tour badge */}
      <div className="absolute top-3 right-3 z-50 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[0.8vw] font-bold tracking-wide">
        Auditee · Automotive SPICE 4.0 walkthrough
      </div>

      {/* Step counter (only during chapter/module so it doesn't clutter intro/closure) */}
      {(current.kind === 'chapter' || current.kind === 'module') && (
        <div className="absolute top-3 left-3 z-50 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[0.8vw] font-bold tracking-wide">
          Step {String((current as { index: number }).index + 1).padStart(2, '0')} / {TOTAL_STEPS}
        </div>
      )}

      {/* Playback controls (just pause — captions/voice handled by each module) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-2 py-2">
        <button
          onClick={togglePause}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/15 rounded-full transition-colors"
          title={paused ? 'Play' : 'Pause'}
          aria-label={paused ? 'Play' : 'Pause'}
          aria-pressed={paused}
        >
          {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
