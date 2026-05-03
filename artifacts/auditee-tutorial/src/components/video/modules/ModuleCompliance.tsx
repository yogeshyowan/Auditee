import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Step six. SmartInhaler hits five frameworks — see live coverage scores." },
  { startMs: 5000,  endMs: 12000, text: "IEC 62304 Class B — 89%. ISO 14971 risk file — 94%. FDA QMSR — 76%. GDPR — 92%. DPDP — 88%." },
  { startMs: 12000, endMs: 18000, text: "Scores update automatically as Ananya merges firmware changes — no manual recompute." },
  { startMs: 18000, endMs: 23000, text: "Walk any finding straight into a CAPA. Continuous compliance, baked in." },
];

const frameworks = [
  { name: 'ISO 26262', pct: 84, color: '#a78bfa' },
  { name: 'IEC 62304', pct: 91, color: '#38bdf8' },
  { name: 'HIPAA', pct: 73, color: '#34d399' },
  { name: 'SOC 2', pct: 88, color: '#fb923c' },
  { name: 'ISO 27001', pct: 67, color: '#c084fc' },
  { name: 'EU AI Act', pct: 55, color: '#f87171' },
];

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · Compliance
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        Always audit-ready.
        <br /><span style={{ color: 'var(--color-accent)' }}>Every framework. Live.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Select the standards your product must meet and watch coverage scores update in real time.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = frameworks.map((_, i) => setTimeout(() => setPhase(i + 1), 200 + i * 700));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Framework Coverage</motion.div>
      <div className="w-[72vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/compliance</div>
        </div>
        <div className="space-y-3">
          {frameworks.map((f, i) => (
            <motion.div key={f.name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -16 }}
              transition={{ type: 'spring', damping: 20 }}>
              <div className="flex justify-between mb-1">
                <span className="text-[1.1vw] text-white/90">{f.name}</span>
                <span className="text-[1vw] font-mono" style={{ color: f.color }}>{f.pct}%</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: f.color }}
                  initial={{ width: '0%' }}
                  animate={{ width: phase > i ? `${f.pct}%` : '0%' }}
                  transition={{ duration: 0.8, delay: 0.2 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const findings = [
    { control: 'ISO 26262 §6.4.9', issue: 'FMEA not linked to BRS-001', severity: 'High' },
    { control: 'SOC 2 CC6.1', issue: 'Access control review overdue', severity: 'Medium' },
  ];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = findings.map((_, i) => setTimeout(() => setPhase(i + 1), 600 + i * 1800));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Findings</motion.div>
      <div className="w-[72vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="space-y-4">
          {findings.map((f, i) => (
            <motion.div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 16 }}
              transition={{ type: 'spring', damping: 18 }}>
              <span className={`text-[0.85vw] font-bold px-2.5 py-1 rounded-lg shrink-0 ${f.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{f.severity}</span>
              <div>
                <div className="text-[0.9vw] text-[var(--color-accent)] font-mono mb-1">{f.control}</div>
                <div className="text-[1.1vw] text-white/90">{f.issue}</div>
              </div>
              <motion.button
                className="ml-auto shrink-0 text-[0.85vw] px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30"
                initial={{ opacity: 0 }} animate={{ opacity: phase > i ? 1 : 0 }} transition={{ delay: 0.4 }}>
                Create CAPA
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene4() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-center" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
        <div className="text-[7vw] font-black text-[var(--color-accent)]">6</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Frameworks Active</div>
        <div className="text-[1.2vw] text-white/40 mt-3">Continuously monitored · audit-ready export</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleCompliance() {
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
