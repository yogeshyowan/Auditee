import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { AppShell } from '../AppShell';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('pdlc');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;
const CUES: TimedCue[] = story.cues;

const STAGES = [
  { name: 'Ideation', icon: '💡', state: 'done', items: 12, evidence: 'Brief signed' },
  { name: 'Design', icon: '✏️', state: 'done', items: 38, evidence: 'HARA · Architecture' },
  { name: 'Development', icon: '⚙️', state: 'done', items: 184, evidence: 'Code · Unit tests' },
  { name: 'Testing', icon: '🧪', state: 'active', items: 92, evidence: 'IEC 62304 V&V 92%' },
  { name: 'Launch', icon: '🚀', state: 'blocked', items: 0, evidence: '2 CAPAs blocking' },
  { name: 'Governance', icon: '🛡️', state: 'pending', items: 0, evidence: 'Awaiting Launch' },
];

const STATE_COLOR: Record<string, string> = {
  done: '#34d399', active: '#38bdf8', blocked: '#f87171', pending: '#94a3b8',
};

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
    const ts = STAGES.map((_, i) => setTimeout(() => setPhase(i + 1), 200 + i * 850));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · 6-Stage Pipeline</motion.div>
      <div className="w-[80vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/pdlc</div>
          <div className="ml-auto text-[0.85vw] text-white/40">Phoenix v2.4 · IEC 62304 + FDA QSR</div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {STAGES.map((s, i) => {
            const c = STATE_COLOR[s.state];
            return (
              <motion.div key={s.name}
                className="relative bg-white/5 border rounded-xl p-3 flex flex-col items-center text-center"
                style={{ borderColor: phase > i ? c + '66' : 'rgba(255,255,255,0.10)' }}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 18 }}
                transition={{ type: 'spring', damping: 20 }}>
                <div className="text-[2.2vw] mb-1">{s.icon}</div>
                <div className="text-[0.95vw] font-bold text-white/95">{s.name}</div>
                <div className="text-[0.7vw] uppercase tracking-wider mt-1" style={{ color: c }}>{s.state}</div>
                <div className="mt-2 text-[1.6vw] font-black" style={{ color: c }}>{s.items > 0 ? s.items : '—'}</div>
                <div className="text-[0.7vw] text-white/45 mt-1 leading-snug">{s.evidence}</div>
                {i < STAGES.length - 1 && (
                  <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-px" style={{ background: phase > i + 1 ? c : 'rgba(255,255,255,0.1)' }} />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const GATE_CHECKS = [
  { label: 'IEC 62304 verification', value: '92%', color: '#38bdf8', good: false },
  { label: 'Risk file (ISO 14971)', value: 'Signed', color: '#34d399', good: true },
  { label: 'CAPA-008 — display latency', value: 'OPEN', color: '#f87171', good: false },
  { label: 'CAPA-011 — force-feedback drift', value: 'OPEN', color: '#f87171', good: false },
  { label: 'Unit test coverage', value: '96%', color: '#34d399', good: true },
  { label: 'Reviewer ready', value: 'Dr Patel', color: '#34d399', good: true },
];

function Scene3() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = GATE_CHECKS.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 700));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Launch Gate Checks</motion.div>
      <div className="w-[58vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[1.4vw] font-semibold text-white/90">Testing → Launch gate</div>
          <div className="text-[0.85vw] text-red-400 font-mono">2 BLOCKERS</div>
        </div>
        <div className="space-y-3">
          {GATE_CHECKS.map((c, i) => (
            <motion.div key={c.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -16 }}
              transition={{ type: 'spring', damping: 20 }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="flex-1 text-[1vw] text-white/85">{c.label}</span>
              <span className="text-[0.95vw] font-mono font-bold" style={{ color: c.color }}>{c.value}</span>
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
        <div className="text-[7vw] font-black text-[var(--color-accent)]">{story.finale.stat}</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">{story.finale.label}</div>
        <div className="text-[1.2vw] text-white/40 mt-3">{story.finale.sub}</div>
      </motion.div>
    </motion.div>
  );
}

export function ModulePdlc() {
  const { currentSceneKey } = useVideoPlayer({ durations: SCENE_DURATIONS, loop: true });
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
      <BackgroundMusic />
      <AppShell slug="pdlc" story={story} currentScene={currentSceneKey} />
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
