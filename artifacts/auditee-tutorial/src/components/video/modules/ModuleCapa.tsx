import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "CAPA Actions — turn every finding into a tracked corrective action." },
  { startMs: 5000,  endMs: 12000, text: "Every gap, audit finding, or compliance failure auto-drafts a CAPA with owner and due date." },
  { startMs: 12000, endMs: 18000, text: "Track from Open through In Progress, In Review, all the way to Verified Closed." },
  { startMs: 18000, endMs: 23000, text: "Full evidence chain — nothing falls through the cracks." },
];

const capas = [
  { id: 'CAPA-001', title: 'Add 10ms latency test for BRS-001', owner: 'A. Singh', status: 'In Progress', due: 'Jun 12' },
  { id: 'CAPA-002', title: 'Link FMEA to requirement BRS-007', owner: 'R. Patel', status: 'Open', due: 'Jun 15' },
  { id: 'CAPA-003', title: 'Encrypt audit log per IEC 62304 §8.4', owner: 'M. Liu', status: 'In Review', due: 'Jun 10' },
];

const statusColors: Record<string, string> = {
  'Open': '#f87171',
  'In Progress': '#fb923c',
  'In Review': '#fbbf24',
  'Closed': '#34d399',
};

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · CAPA Actions
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        Every finding becomes
        <br /><span style={{ color: 'var(--color-accent)' }}>a tracked action.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        CAPA items are auto-drafted with owners, due dates, and evidence — no manual copy-paste.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = capas.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 1500));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · CAPA List</motion.div>
      <div className="w-[76vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/capa</div>
        </div>
        <div className="space-y-3">
          {capas.map((c, i) => (
            <motion.div key={c.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -20 }}
              transition={{ type: 'spring', damping: 18 }}>
              <span className="text-[0.85vw] font-mono text-[var(--color-accent)] shrink-0 w-[6vw]">{c.id}</span>
              <span className="flex-1 text-[1.1vw] text-white/90">{c.title}</span>
              <span className="text-[0.85vw] text-white/50 shrink-0">{c.owner}</span>
              <span className="text-[0.8vw] font-mono text-white/40 shrink-0">Due {c.due}</span>
              <span className="text-[0.8vw] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: `${statusColors[c.status]}20`, color: statusColors[c.status] }}>
                {c.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const stages = ['Open', 'In Progress', 'In Review', 'Verified Closed'];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const ts = stages.map((_, i) => setTimeout(() => setActive(i), i * 1200));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Lifecycle Tracking</motion.div>
      <div className="flex items-center gap-3 w-[70vw]">
        {stages.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-2">
            <motion.div className="w-full py-3 rounded-xl text-center text-[1vw] font-semibold border"
              animate={{
                background: active >= i ? `${Object.values(statusColors)[i]}20` : 'rgba(255,255,255,0.03)',
                borderColor: active >= i ? Object.values(statusColors)[i] : 'rgba(255,255,255,0.1)',
                color: active >= i ? Object.values(statusColors)[i] : 'rgba(255,255,255,0.3)',
              }}
              transition={{ duration: 0.4 }}>
              {s}
            </motion.div>
            {i < stages.length - 1 && (
              <motion.div className="absolute h-0.5 w-8" style={{ right: '-1rem' }}
                animate={{ background: active > i ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        ))}
      </div>
      <motion.p className="text-[1.2vw] text-white/50 mt-8"
        animate={{ opacity: active >= 3 ? 1 : 0 }} transition={{ duration: 0.5 }}>
        CAPA-003 · Verified Closed · evidence attached
      </motion.p>
    </motion.div>
  );
}

function Scene4() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-center" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
        <div className="text-[7vw] font-black text-[var(--color-accent)]">100%</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">CAPA Closure Rate</div>
        <div className="text-[1.2vw] text-white/40 mt-3">Full evidence chain · audit-ready</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleCapa() {
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
          style={{ background: '#34d399' }}
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
