import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Step eleven. Automate Acme's PR-to-release gating — no more manual sign-offs." },
  { startMs: 5000,  endMs: 12000, text: "PR merged to main? Auto-link the requirement, assign Marcus as reviewer, block until tests pass." },
  { startMs: 12000, endMs: 18000, text: "Stage gates: design freeze, V and V complete, regulatory review — no code required to configure." },
  { startMs: 18000, endMs: 23000, text: "Nothing ships until every gate passes. Full audit trail of who approved what." },
];

const stages = [
  { name: 'Requirements Review', color: '#a78bfa', checks: ['All BRS reviewed', 'Standards tagged'] },
  { name: 'Safety Analysis', color: '#38bdf8', checks: ['FMEA complete', 'ASIL assigned'] },
  { name: 'Code Review', color: '#34d399', checks: ['Coverage > 85%', 'No critical gaps'] },
  { name: 'Sign-off', color: '#fb923c', checks: ['Owner approved', 'Compliance signed'] },
];

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · Workflows
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        Automate every
        <br /><span style={{ color: 'var(--color-accent)' }}>review and sign-off gate.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Define pipeline stages with automated and manual gates — nothing advances until it passes.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = stages.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 1300));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Pipeline View</motion.div>
      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/workflows</div>
        </div>
        <div className="flex items-stretch gap-3">
          {stages.map((s, i) => (
            <motion.div key={s.name} className="flex-1 rounded-xl border p-4 flex flex-col gap-3"
              style={{ borderColor: `${s.color}40`, background: `${s.color}08` }}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 20, scale: phase > i ? 1 : 0.9 }}
              transition={{ type: 'spring', damping: 18 }}>
              <div className="text-[1.05vw] font-semibold" style={{ color: s.color }}>{s.name}</div>
              <div className="space-y-2 flex-1">
                {s.checks.map((c) => (
                  <div key={c} className="flex items-center gap-2 text-[0.85vw] text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                    {c}
                  </div>
                ))}
              </div>
              {phase > i && (
                <motion.div className="text-[0.75vw] font-mono px-2 py-1 rounded-md text-center"
                  style={{ background: `${s.color}20`, color: s.color }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  {i < 2 ? '✓ Passed' : i === 2 ? '⟳ In progress' : '⏳ Waiting'}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const gates = [
    { label: 'BRS reviewed', passed: true },
    { label: 'Standards tagged', passed: true },
    { label: 'FMEA completed', passed: true },
    { label: 'Coverage > 85%', passed: false, detail: '81% — 4% to go' },
  ];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = gates.map((_, i) => setTimeout(() => setPhase(i + 1), 400 + i * 1100));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Gate Checks</motion.div>
      <div className="w-[58vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="space-y-3">
          {gates.map((g, i) => (
            <motion.div key={g.label} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -16 }}
              transition={{ type: 'spring', damping: 20 }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: g.passed ? '#34d39920' : '#f8717120', border: `1.5px solid ${g.passed ? '#34d399' : '#f87171'}` }}>
                <span style={{ color: g.passed ? '#34d399' : '#f87171', fontSize: '0.8vw' }}>{g.passed ? '✓' : '✗'}</span>
              </div>
              <span className="flex-1 text-[1.1vw] text-white/90">{g.label}</span>
              {g.detail && <span className="text-[0.85vw] text-[#f87171]">{g.detail}</span>}
            </motion.div>
          ))}
        </div>
        <motion.div className="mt-4 text-[0.9vw] text-[#f87171]"
          animate={{ opacity: phase >= gates.length ? 1 : 0 }}>
          Stage blocked — resolve failing gate to advance.
        </motion.div>
      </div>
    </motion.div>
  );
}

function Scene4() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-center" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
        <div className="text-[7vw] font-black text-[var(--color-accent)]">4</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Pipeline Stages</div>
        <div className="text-[1.2vw] text-white/40 mt-3">Every gate logged · full audit trail</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleWorkflows() {
  const { currentSceneKey } = useVideoPlayer({ durations: SCENE_DURATIONS, loop: true });
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
      <BackgroundMusic />
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full opacity-20 blur-[80px]"
          style={{ background: 'var(--color-accent)' }}
          animate={{ x: ['0%','10%','-5%','0%'], y: ['0%','-10%','5%','0%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full opacity-15 blur-[80px]"
          style={{ background: 'var(--color-accent-alt)' }}
          animate={{ x: ['0%','-8%','4%','0%'], y: ['0%','8%','-4%','0%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
      <AnimatePresence initial={false} mode="wait">
        {currentSceneKey === 'scene1' && <Scene1 key="scene1" />}
        {currentSceneKey === 'scene2' && <Scene2 key="scene2" />}
        {currentSceneKey === 'scene3' && <Scene3 key="scene3" />}
        {currentSceneKey === 'scene4' && <Scene4 key="scene4" />}
      </AnimatePresence>
      <TimedCaptions cues={CUES} totalMs={TOTAL_MS} />
    </div>
  );
}
