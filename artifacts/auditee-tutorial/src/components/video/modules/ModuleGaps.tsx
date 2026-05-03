import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('gaps');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = story.cues;

const gaps = [
  { file: 'src/brake/EmergencyController.ts', req: 'BRS-001', severity: 'Critical', issue: 'No unit test for 10ms latency bound' },
  { file: 'src/sensor/FusionModule.ts', req: 'PRD-014', severity: 'High', issue: 'Requirement untraced to implementation' },
  { file: 'src/log/AuditWriter.ts', req: 'FRD-031', severity: 'Medium', issue: 'Encryption not verified against spec' },
];

const sevColors: Record<string, string> = { Critical: '#f87171', High: '#fb923c', Medium: '#fbbf24' };

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {story.hero.kicker}
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        {story.hero.lineA}
        <br /><span style={{ color: 'var(--color-accent)' }}>{story.hero.lineB}</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        {story.hero.subtitle}
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [scanPct, setScanPct] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / 4500) * 100));
      setScanPct(p);
      if (p >= 100) { setDone(true); clearInterval(id); }
    }, 60);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Scanning Codebase</motion.div>
      <div className="w-[62vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/gaps</div>
        </div>
        <div className="font-mono text-[1vw] text-white/60 mb-4 space-y-1">
          <div>{'>'} Scanning 1,840 files against 247 requirements…</div>
          {scanPct > 30 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{'>'} Checking ISO 26262 traceability matrix…</motion.div>}
          {scanPct > 60 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{'>'} Running test coverage analysis…</motion.div>}
          {done && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#f87171]">{'>'} 3 critical gaps found.</motion.div>}
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: scanPct < 100 ? 'var(--color-accent)' : '#34d399' }}
            animate={{ width: `${scanPct}%` }} transition={{ duration: 0.1 }} />
        </div>
        <div className="mt-2 text-right text-[0.9vw] text-white/40 font-mono">{scanPct}%</div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = gaps.map((_, i) => setTimeout(() => setPhase(i + 1), 400 + i * 1400));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Gap Findings</motion.div>
      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="space-y-3">
          {gaps.map((g, i) => (
            <motion.div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -20 }}
              transition={{ type: 'spring', damping: 18 }}>
              <span className="text-[0.8vw] font-bold px-2 py-1 rounded-lg shrink-0 mt-0.5"
                style={{ background: `${sevColors[g.severity]}20`, color: sevColors[g.severity] }}>{g.severity}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[1vw] font-mono text-white/70 truncate mb-1">{g.file}</div>
                <div className="text-[1.1vw] text-white/90">{g.issue}</div>
              </div>
              <span className="text-[0.85vw] font-mono text-[var(--color-accent)] shrink-0">{g.req}</span>
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
        <div className="text-[7vw] font-black" style={{ color: '#f87171' }}>{story.finale.stat}</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">{story.finale.label}</div>
        <div className="text-[1.2vw] text-white/40 mt-3">{story.finale.sub}</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleGaps() {
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
          style={{ background: '#f87171' }}
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
