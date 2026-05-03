import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('interview');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = story.cues;

const questions = [
  { q: "What is the primary user action this feature must support?", delay: 400 },
  { q: "Which ISO 26262 ASIL level applies to this function?", delay: 1600 },
  { q: "What are the maximum acceptable latency targets?", delay: 2800 },
];

const answers = [
  { text: "User initiates emergency brake via brake pedal press", delay: 500 },
  { text: "ASIL D — highest safety integrity level required", delay: 1700 },
  { text: "≤ 10 ms end-to-end brake actuation latency", delay: 2900 },
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
    const ts = [...questions, ...answers].map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 600));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Interview in Progress</motion.div>
      <div className="w-[68vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/interview</div>
        </div>
        <div className="space-y-3 max-h-[30vh] overflow-hidden">
          {questions.map((item, i) => (
            <motion.div key={i} className="flex gap-3 items-start"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -20 }}
              transition={{ type: 'spring', damping: 20 }}>
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center text-[0.85vw] font-bold text-[var(--color-accent)] shrink-0">AI</div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[1.1vw] text-white/90">{item.q}</div>
            </motion.div>
          ))}
          {answers.slice(0, Math.max(0, phase - questions.length)).map((item, i) => (
            <motion.div key={`a${i}`} className="flex gap-3 items-start justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', damping: 20 }}>
              <div className="bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 rounded-xl px-4 py-2.5 text-[1.1vw] text-white/90 max-w-[60%]">{item.text}</div>
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[0.85vw] font-bold text-white/60 shrink-0">You</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const generated = [
  { id: 'BRS-001', text: 'Emergency brake actuation ≤ 10 ms', tag: 'ASIL D' },
  { id: 'BRS-002', text: 'Brake pedal force sensor redundancy', tag: 'Safety' },
  { id: 'FRD-007', text: 'Audit log for every brake event', tag: 'Compliance' },
];

function Scene3() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = generated.map((_, i) => setTimeout(() => setPhase(i + 1), 500 + i * 1200));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Requirements Generated</motion.div>
      <div className="w-[72vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/requirements</div>
        </div>
        <div className="space-y-3">
          {generated.map((r, i) => (
            <motion.div key={r.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 16, scale: phase > i ? 1 : 0.95 }}
              transition={{ type: 'spring', damping: 18 }}>
              <span className="text-[0.9vw] font-mono text-[var(--color-accent)] shrink-0">{r.id}</span>
              <span className="flex-1 text-[1.1vw] text-white/90">{r.text}</span>
              <span className="text-[0.85vw] px-2.5 py-1 rounded-full bg-[var(--color-accent-alt)]/20 text-[var(--color-accent-alt)]">{r.tag}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[0.95vw] text-white/50">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AI generated 3 of 18 requirements · provenance linked
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

export function ModuleInterview() {
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
