import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { AppShell } from '../AppShell';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('traceability');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = story.cues;

const nodes = [
  { id: 'BRS-001', type: 'req', x: '10%', y: '38%', color: '#a78bfa' },
  { id: 'PRD-014', type: 'req', x: '10%', y: '62%', color: '#a78bfa' },
  { id: 'EmergencyCtrl.ts', type: 'code', x: '38%', y: '38%', color: '#38bdf8' },
  { id: 'FusionModule.ts', type: 'code', x: '38%', y: '62%', color: '#38bdf8' },
  { id: 'brake.test.ts', type: 'test', x: '65%', y: '30%', color: '#34d399' },
  { id: 'sensor.test.ts', type: 'test', x: '65%', y: '55%', color: '#34d399' },
  { id: 'CAPA-003', type: 'capa', x: '88%', y: '45%', color: '#fb923c' },
];

const edges = [
  { from: 0, to: 2 }, { from: 1, to: 3 },
  { from: 2, to: 4 }, { from: 3, to: 5 },
  { from: 4, to: 6 }, { from: 5, to: 6 },
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
    const ts = nodes.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 600));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Interactive Graph</motion.div>
      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '38vh' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/traceability</div>
        </div>
        <div className="relative w-full" style={{ height: 'calc(100% - 48px)' }}>
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            {edges.map((e, i) => {
              const from = nodes[e.from]; const to = nodes[e.to];
              return (
                <motion.line key={i}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase > Math.max(e.from, e.to) ? 1 : 0 }}
                  transition={{ duration: 0.4 }} />
              );
            })}
          </svg>
          {nodes.map((n, i) => (
            <motion.div key={n.id}
              className="absolute flex items-center justify-center rounded-full text-[0.75vw] font-mono font-bold shadow-lg"
              style={{ left: n.x, top: n.y, transform: 'translate(-50%,-50%)', background: `${n.color}25`, border: `1.5px solid ${n.color}60`, padding: '6px 12px', color: n.color, whiteSpace: 'nowrap' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: phase > i ? 1 : 0, scale: phase > i ? 1 : 0 }}
              transition={{ type: 'spring', damping: 14 }}>
              {n.id}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const stats = [
    { label: 'Requirements', val: '247', pct: 91 },
    { label: 'Code files', val: '1,840', pct: 87 },
    { label: 'Test cases', val: '312', pct: 94 },
  ];
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Coverage Stats</motion.div>
      <div className="grid grid-cols-3 gap-5 w-[62vw]">
        {stats.map((s, i) => (
          <motion.div key={s.label} className="bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[1.6vw] text-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, type: 'spring', damping: 18 }}>
            <div className="text-[2.8vw] font-black text-[var(--color-accent)]">{s.val}</div>
            <div className="text-[1vw] text-white/60 mb-3">{s.label}</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: 'var(--color-accent)' }}
                initial={{ width: '0%' }} animate={{ width: `${s.pct}%` }}
                transition={{ duration: 1, delay: 0.4 + i * 0.2 }} />
            </div>
            <div className="text-[0.85vw] text-white/40 mt-1">{s.pct}% traced</div>
          </motion.div>
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

export function ModuleTraceability() {
  const { currentSceneKey } = useVideoPlayer({ durations: SCENE_DURATIONS, loop: true });
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
      <BackgroundMusic />
      <AppShell slug="traceability" story={story} currentScene={currentSceneKey} />
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
