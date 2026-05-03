import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Defects — Jira, Bugzilla, and ServiceNow synced and linked to requirements." },
  { startMs: 5000,  endMs: 12000, text: "Defects are automatically linked to the requirements they violate and the tests that should have caught them." },
  { startMs: 12000, endMs: 18000, text: "See defect trends over time — churn, age, and CAPA linkage in one view." },
  { startMs: 18000, endMs: 23000, text: "Close the loop from defect to root cause to corrective action." },
];

const defects = [
  { id: 'DEF-441', src: 'Jira', title: 'Brake ECU fault not triggering fail-safe', req: 'BRS-007', severity: 'Critical' },
  { id: 'DEF-389', src: 'Bugzilla', title: 'Sensor fusion latency exceeds 10ms under load', req: 'PRD-014', severity: 'High' },
  { id: 'DEF-302', src: 'ServiceNow', title: 'Audit log missing timestamp in UTC+5:30', req: 'FRD-031', severity: 'Medium' },
];

const srcColors: Record<string, string> = { 'Jira': '#38bdf8', 'Bugzilla': '#fb923c', 'ServiceNow': '#34d399' };
const sevColors: Record<string, string> = { Critical: '#f87171', High: '#fb923c', Medium: '#fbbf24' };

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · Defects
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        Defects linked back
        <br /><span style={{ color: 'var(--color-accent)' }}>to what they broke.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Pull from Jira, Bugzilla, or ServiceNow and automatically link each defect to its requirement and test.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = defects.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 1500));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Defect Board</motion.div>
      <div className="w-[76vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/defects</div>
        </div>
        <div className="space-y-3">
          {defects.map((d, i) => (
            <motion.div key={d.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -16 }}
              transition={{ type: 'spring', damping: 18 }}>
              <span className="text-[0.85vw] font-mono text-white/50 shrink-0 w-[5vw]">{d.id}</span>
              <span className="text-[0.75vw] px-2 py-0.5 rounded-md shrink-0" style={{ background: `${srcColors[d.src]}20`, color: srcColors[d.src] }}>{d.src}</span>
              <span className="flex-1 text-[1.05vw] text-white/90">{d.title}</span>
              <span className="text-[0.8vw] font-mono text-[var(--color-accent)] shrink-0">{d.req}</span>
              <span className="text-[0.8vw] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: `${sevColors[d.severity]}20`, color: sevColors[d.severity] }}>{d.severity}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 text-[0.9vw] text-white/40">87 total defects · 3 unlinked to requirements</div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const vals = [12, 18, 14, 9, 15, 7];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const ts = months.map((_, i) => setTimeout(() => setShown(i + 1), 300 + i * 700));
    return () => ts.forEach(clearTimeout);
  }, []);
  const maxVal = Math.max(...vals);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Defect Trends</motion.div>
      <div className="w-[62vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="text-[1.2vw] font-semibold text-white/80 mb-4">New defects per month</div>
        <div className="flex items-end gap-4 h-[22vh]">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-2">
              <motion.div className="w-full rounded-t-lg" style={{ background: 'var(--color-accent)', minHeight: 4 }}
                initial={{ height: 0 }} animate={{ height: shown > i ? `${(vals[i] / maxVal) * 80}%` : 0 }}
                transition={{ duration: 0.5, type: 'spring', damping: 18 }} />
              <span className="text-[0.85vw] text-white/50">{m}</span>
            </div>
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
        <div className="text-[7vw] font-black text-[var(--color-accent)]">87</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Defects Tracked</div>
        <div className="text-[1.2vw] text-white/40 mt-3">Jira · Bugzilla · ServiceNow · linked to reqs</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleDefects() {
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
