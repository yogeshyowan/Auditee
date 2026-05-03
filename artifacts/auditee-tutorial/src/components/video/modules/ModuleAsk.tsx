import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { AppShell } from '../AppShell';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('ask');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;
const CUES: TimedCue[] = story.cues;

const QUERY = 'Which Sirius requirements affect handover latency?';
const TYPING_MS = 1700;

const ANSWER_LINES = [
  '14 requirements affect handover latency on Sirius:',
  '• PRD-031 — N2 / Xn signalling end-to-end ≤ 50 ms',
  '• PRD-044 — gNB → AMF context release ≤ 80 ms',
  '• FRD-112 — UPF reselection on handover preserves session',
  '• … 11 more — all linked to 3GPP TS 23.501 §5.3',
];

const CITATIONS = [
  { label: 'PRD-031', kind: 'Requirement', color: '#38bdf8' },
  { label: '3GPP TS 23.501 §5.3', kind: 'Standard', color: '#a78bfa' },
  { label: 'CAPA-014', kind: 'Open CAPA', color: '#fb923c' },
  { label: 'TST-209', kind: 'Test (passing)', color: '#34d399' },
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
  const [typed, setTyped] = useState('');
  const [answerPhase, setAnswerPhase] = useState(0);
  useEffect(() => {
    const stepMs = TYPING_MS / QUERY.length;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(QUERY.slice(0, i));
      if (i >= QUERY.length) clearInterval(id);
    }, stepMs);
    const ts = ANSWER_LINES.map((_, k) =>
      setTimeout(() => setAnswerPhase(k + 1), TYPING_MS + 400 + k * 700)
    );
    return () => { clearInterval(id); ts.forEach(clearTimeout); };
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Ask &amp; Answer</motion.div>
      <div className="w-[68vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/ask</div>
          <div className="ml-auto text-[0.8vw] text-white/40">Sirius · 5G Core</div>
        </div>

        {/* User query bubble */}
        <div className="flex justify-end mb-4">
          <div className="max-w-[80%] bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 rounded-2xl rounded-tr-sm px-4 py-3">
            <div className="text-[0.7vw] uppercase tracking-wider text-[var(--color-accent)] mb-1">Aman · Architect</div>
            <div className="text-[1.05vw] text-white/95 font-mono">
              {typed}
              <span className="inline-block w-[0.4vw] h-[1vw] bg-[var(--color-accent)] ml-1 align-middle animate-pulse" />
            </div>
          </div>
        </div>

        {/* Auditee answer bubble */}
        <div className="flex justify-start">
          <div className="max-w-[88%] bg-white/5 border border-white/15 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="text-[0.7vw] uppercase tracking-wider text-white/50 mb-2">Auditee · grounded answer</div>
            <div className="space-y-1.5">
              {ANSWER_LINES.map((line, i) => (
                <motion.div key={i} className="text-[0.95vw] text-white/85 leading-relaxed"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: answerPhase > i ? 1 : 0, y: answerPhase > i ? 0 : 6 }}
                  transition={{ duration: 0.25 }}>
                  {line}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = CITATIONS.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 800));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Citations</motion.div>
      <div className="w-[58vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="text-[1.3vw] font-semibold text-white/90 mb-4">Every claim, sourced.</div>
        <div className="space-y-3">
          {CITATIONS.map((c, i) => (
            <motion.div key={c.label} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/5 border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -20 }}
              transition={{ type: 'spring', damping: 20 }}>
              <div className="w-1.5 h-8 rounded-full" style={{ background: c.color }} />
              <span className="text-[1.05vw] font-mono font-bold" style={{ color: c.color }}>{c.label}</span>
              <span className="text-[0.85vw] text-white/55 ml-auto">{c.kind}</span>
            </motion.div>
          ))}
        </div>
        <motion.div className="mt-5 p-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-center"
          animate={{ opacity: phase >= CITATIONS.length ? 1 : 0 }} transition={{ duration: 0.4 }}>
          <span className="text-[0.95vw] text-[var(--color-accent)] font-semibold">Zero hallucinations · every link clickable · audit-ready</span>
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
        <div className="text-[7vw] font-black text-[var(--color-accent)]">{story.finale.stat}</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">{story.finale.label}</div>
        <div className="text-[1.2vw] text-white/40 mt-3">{story.finale.sub}</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleAsk() {
  const { currentSceneKey } = useVideoPlayer({ durations: SCENE_DURATIONS, loop: true });
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
      <BackgroundMusic />
      <AppShell slug="ask" story={story} currentScene={currentSceneKey} />
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
