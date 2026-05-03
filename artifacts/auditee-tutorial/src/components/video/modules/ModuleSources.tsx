import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 6000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 22000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Step one. Acme Health is shipping SmartInhaler Connect — let's wire up their tools." },
  { startMs: 5000,  endMs: 11000, text: "Pull from GitHub firmware, Jira, IBM DOORS legacy specs, and twelve clinical evaluation PDFs." },
  { startMs: 11000, endMs: 17000, text: "Auditee parses everything in seconds — reqs, code, standards — into one graph." },
  { startMs: 17000, endMs: 22000, text: "Six sources connected. 247 requirements. Ready for Step two." },
];

const connectors = [
  { name: 'IBM DOORS', color: '#38bdf8' },
  { name: 'GitHub', color: '#a78bfa' },
  { name: 'Jira', color: '#38bdf8' },
  { name: 'Azure DevOps', color: '#34d399' },
  { name: 'Upload Docs', color: '#fb923c' },
  { name: 'ReqIF', color: '#c084fc' },
];

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · Project Sources
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        One platform.
        <br /><span style={{ color: 'var(--color-accent)' }}>All your data sources.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Connect RM tools, code repos, and doc archives — nothing else works until sources are in.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = connectors.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 700));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Connect</motion.div>
      <div className="w-[72vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/sources</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {connectors.map((c, i) => (
            <motion.div key={c.name}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 16, scale: phase > i ? 1 : 0.9 }}
              transition={{ type: 'spring', damping: 18 }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-[1.1vw] text-white/90">{c.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / 5000) * 100));
      setPct(p);
      if (p >= 100) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Ingesting</motion.div>
      <div className="w-[62vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="text-[1.6vw] font-semibold mb-6 text-white/90">Parsing and structuring your data…</div>
        <div className="space-y-4">
          {['Requirements extracted', 'Code files indexed', 'Standards cross-referenced'].map((label, i) => (
            <div key={label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[1vw] text-white/60">{label}</span>
                <span className="text-[1vw] text-[var(--color-accent)] font-mono">{Math.min(100, Math.round(pct * (1 - i * 0.1)))}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: 'var(--color-accent)' }}
                  animate={{ width: `${Math.min(100, Math.round(pct * (1 - i * 0.1)))}%` }}
                  transition={{ duration: 0.1 }} />
              </div>
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
        <div className="text-[7vw] font-black text-[var(--color-accent)]">6</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Sources Connected</div>
        <div className="text-[1.2vw] text-white/40 mt-3">247 requirements · 1,840 files · 12 standards</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleSources() {
  const { currentSceneKey } = useVideoPlayer({ durations: SCENE_DURATIONS, loop: true });
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
      <BackgroundMusic />
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full opacity-20 blur-[80px]"
          style={{ background: 'var(--color-accent)' }}
          animate={{ x: ['0%','10%','-5%','0%'], y: ['0%','-10%','5%','0%'], scale: [1,1.1,0.9,1] }}
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
