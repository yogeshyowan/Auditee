import { motion, AnimatePresence } from 'framer-motion';
import type { ModuleKey, DemoStoryline } from '@/lib/demoUseCases';

const NAV: { slug: ModuleKey; label: string; icon: string }[] = [
  { slug: 'dashboard', label: 'Dashboard', icon: '◧' },
  { slug: 'sources', label: 'Project Sources', icon: '⌥' },
  { slug: 'interview', label: 'Smart Interview', icon: '✦' },
  { slug: 'requirements', label: 'Requirements', icon: '☰' },
  { slug: 'gaps', label: 'Requirements Gap Detection', icon: '◇' },
  { slug: 'traceability', label: 'Traceability', icon: '⇌' },
  { slug: 'compliance', label: 'Compliance', icon: '◈' },
  { slug: 'capa', label: 'CAPA', icon: '⚑' },
  { slug: 'defects', label: 'Defects', icon: '◉' },
  { slug: 'tests', label: 'Test Cases', icon: '✓' },
  { slug: 'reports', label: 'Reports', icon: '⎙' },
  { slug: 'workflows', label: 'Workflows', icon: '↻' },
  { slug: 'analytics', label: 'Analytics', icon: '∿' },
  { slug: 'recurring-audits', label: 'Recurring Audits', icon: '◐' },
  { slug: 'legacy', label: 'Legacy Systems', icon: '▣' },
  { slug: 'pdlc', label: 'PDLC Pipeline', icon: '⇨' },
  { slug: 'ask', label: 'Ask Auditee', icon: '✺' },
];

const SCENE_TO_INDEX: Record<string, number> = {
  scene1: 0, scene2: 1, scene3: 2, scene4: 3,
};

export function AppShell({
  slug, story, currentScene,
}: {
  slug: ModuleKey;
  story: DemoStoryline;
  currentScene: string;
}) {
  const stepIdx = SCENE_TO_INDEX[currentScene] ?? 0;
  const step = story.steps[stepIdx] ?? story.steps[0];
  const current = NAV.find((n) => n.slug === slug);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 font-display text-white">
      {/* Top bar — auditee.site logo + project switcher */}
      <div data-appshell-topbar className="absolute top-0 left-0 right-0 h-[5vh] bg-black/55 backdrop-blur-md border-b border-white/10 flex items-center px-[1.5vw] gap-[1.5vw]">
        <div className="flex items-center gap-[0.5vw]">
          <div className="w-[1.6vw] h-[1.6vw] rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[0.9vw] font-black">A</div>
          <span className="font-black text-[1.1vw] tracking-tight">auditee<span className="text-violet-400">.site</span></span>
        </div>
        <div className="h-[2vh] w-px bg-white/15" />
        <div className="flex items-center gap-[0.5vw] px-[0.7vw] py-[0.4vh] rounded-md bg-white/8 border border-white/15">
          <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[0.85vw] text-white/85 font-medium">{story.project}</span>
          <span className="text-[0.7vw] text-white/40 ml-[0.3vw]">▾</span>
        </div>
        <span className="text-[0.75vw] text-white/40 uppercase tracking-[0.25em]">{story.domain}</span>
        <div className="ml-auto flex items-center gap-[0.6vw]">
          <span className="text-[0.75vw] text-white/45">⌘K Search</span>
          <div className="w-[1.6vw] h-[1.6vw] rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border border-white/20" />
        </div>
      </div>

      {/* Left sidebar — all 17 pages, current highlighted */}
      <div data-appshell-sidebar className="absolute top-[5vh] left-0 bottom-[8vh] w-[13vw] bg-black/55 backdrop-blur-md border-r border-white/10 py-[1vh] overflow-hidden">
        <div className="text-[0.65vw] text-white/35 uppercase tracking-[0.25em] px-[1vw] mb-[0.6vh]">Workspace</div>
        <div className="flex flex-col gap-[0.15vh] px-[0.5vw]">
          {NAV.map((n) => {
            const active = n.slug === slug;
            return (
              <div key={n.slug}
                className={`flex items-center gap-[0.5vw] px-[0.7vw] py-[0.55vh] rounded-md text-[0.78vw] ${
                  active ? 'bg-white/12 text-white font-semibold' : 'text-white/55'
                }`}>
                <span className={`w-[0.9vw] text-center ${active ? 'text-violet-300' : 'text-white/40'}`}>{n.icon}</span>
                <span className="truncate">{n.label}</span>
                {active && <span className="ml-auto w-[0.4vw] h-[0.4vw] rounded-full bg-violet-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom show-and-tell strip — current step caption */}
      <div data-appshell-bottom className="absolute bottom-0 left-0 right-0 h-[8vh] bg-gradient-to-t from-black/90 via-black/75 to-black/0 backdrop-blur-sm flex items-center px-[2vw] gap-[1.5vw] border-t border-white/8">
        <div className="flex items-center gap-[0.5vw] shrink-0">
          <div className="w-[2.4vw] h-[2.4vw] rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-[1.1vw] font-black text-violet-300">{stepIdx + 1}</div>
          <div className="text-[0.7vw] uppercase tracking-[0.25em] text-white/40">Step {stepIdx + 1}/4</div>
        </div>
        <div className="h-[3vh] w-px bg-white/12" />
        <AnimatePresence mode="wait">
          <motion.div key={currentScene}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="flex-1 min-w-0">
            <div className="text-[1.05vw] font-bold text-white truncate">{step.title}</div>
            <div className="text-[0.8vw] text-white/65 truncate">{step.body}</div>
          </motion.div>
        </AnimatePresence>
        <div className="ml-auto shrink-0 flex items-center gap-[0.4vw]">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`h-[0.4vh] rounded-full transition-all ${
              i === stepIdx ? 'w-[2.5vw] bg-violet-400' : i < stepIdx ? 'w-[1vw] bg-violet-400/40' : 'w-[1vw] bg-white/15'
            }`} />
          ))}
        </div>
      </div>

      {/* Subtle "live" badge top-right corner of content */}
      <div data-appshell-live-badge className="absolute top-[6vh] right-[1vw] flex items-center gap-[0.4vw] px-[0.6vw] py-[0.3vh] rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[0.7vw] text-emerald-300 font-semibold">
        <span className="w-[0.4vw] h-[0.4vw] rounded-full bg-emerald-400 animate-pulse" />
        SHOWING · {current?.label.toUpperCase()}
      </div>
    </div>
  );
}
