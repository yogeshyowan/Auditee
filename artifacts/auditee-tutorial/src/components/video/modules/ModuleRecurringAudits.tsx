import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('recurring-audits');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = story.cues;

const audits = [
  { name: 'VASP Screening', cadence: 'Daily', next: 'Tomorrow 09:00', status: 'Scheduled' },
  { name: 'Travel-Rule Review', cadence: 'Weekly', next: 'Mon 10:00', status: 'Running' },
  { name: 'SOC 2 Internal Audit', cadence: 'Monthly', next: 'Jun 1', status: 'Completed' },
];

const flowSteps = [
  { label: 'Audit runs', icon: '▶', color: '#a78bfa' },
  { label: 'Findings generated', icon: '⚡', color: '#38bdf8' },
  { label: 'CAPAs auto-created', icon: '✓', color: '#34d399' },
  { label: 'Owners notified', icon: '✉', color: '#fb923c' },
];

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
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = audits.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 1600));
    return () => ts.forEach(clearTimeout);
  }, []);
  const statusColor: Record<string, string> = {
    Scheduled: '#38bdf8', Running: '#fbbf24', Completed: '#34d399',
  };
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Audit Schedule</motion.div>
      <div className="w-[72vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/recurring-audits</div>
        </div>
        <div className="space-y-3">
          {audits.map((a, i) => (
            <motion.div key={a.name} className="flex items-center gap-5 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -20 }}
              transition={{ type: 'spring', damping: 18 }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor[a.status] }} />
              <span className="flex-1 text-[1.1vw] text-white/90">{a.name}</span>
              <span className="text-[0.9vw] text-white/50 shrink-0">{a.cadence}</span>
              <span className="text-[0.85vw] font-mono text-white/40 shrink-0">Next: {a.next}</span>
              <span className="text-[0.8vw] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: `${statusColor[a.status]}20`, color: statusColor[a.status] }}>
                {a.status}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 text-[0.9vw] text-white/40 flex gap-4">
          <span>3 active schedules</span><span>·</span><span>Next run in 4 days</span>
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = flowSteps.map((_, i) => setTimeout(() => setPhase(i + 1), 500 + i * 1100));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Auto-Flow</motion.div>
      <div className="flex items-center gap-3 w-[62vw]">
        {flowSteps.map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col items-center gap-3">
            <motion.div className="w-full py-4 rounded-2xl text-center flex flex-col items-center gap-2"
              style={{ background: `${s.color}12`, border: `1.5px solid ${s.color}40` }}
              initial={{ opacity: 0, y: 16, scale: 0.85 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 16, scale: phase > i ? 1 : 0.85 }}
              transition={{ type: 'spring', damping: 16 }}>
              <span className="text-[1.8vw]" style={{ color: s.color }}>{s.icon}</span>
              <span className="text-[0.9vw] font-semibold text-white/80 text-center leading-tight">{s.label}</span>
            </motion.div>
            {i < flowSteps.length - 1 && (
              <motion.div className="text-[1.5vw] text-white/20 absolute"
                animate={{ opacity: phase > i ? 1 : 0 }}>→</motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Scene4() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-center" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
        <div className="text-[7vw] font-black text-[var(--color-accent)]">{story.finale.stat}</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">{story.finale.label}</div>
        <div className="text-[1.2vw] text-white/40 mt-3">{story.finale.sub}</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleRecurringAudits() {
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
