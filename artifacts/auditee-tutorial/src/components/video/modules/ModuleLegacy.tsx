import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { AppShell } from '../AppShell';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('legacy');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;
const CUES: TimedCue[] = story.cues;

const HEAT_MODULES = [
  { name: 'PAY-POST.cbl', loc: 28400, risk: 92, cics: 'PPST' },
  { name: 'FX-MARGIN.cbl', loc: 18920, risk: 88, cics: 'FXMG' },
  { name: 'EOD-BATCH.jcl', loc: 9120, risk: 84, cics: 'EODB' },
  { name: 'KYC-LOOKUP.cbl', loc: 14580, risk: 71, cics: 'KYCL' },
  { name: 'NACHA-OUT.cbl', loc: 7240, risk: 64, cics: 'NACH' },
  { name: 'SETTLE.cbl', loc: 22980, risk: 58, cics: 'SETL' },
  { name: 'POSTING.cbl', loc: 11200, risk: 41, cics: 'POST' },
  { name: 'STATEMENT.cbl', loc: 6800, risk: 22, cics: 'STMT' },
];

function riskColor(r: number) {
  if (r >= 80) return '#f87171';
  if (r >= 60) return '#fb923c';
  if (r >= 40) return '#fbbf24';
  return '#34d399';
}

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
    const ts = HEAT_MODULES.map((_, i) => setTimeout(() => setPhase(i + 1), 250 + i * 600));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Risk Heatmap</motion.div>
      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/legacy</div>
          <div className="ml-auto text-[0.85vw] text-white/40 font-mono">Mercury · 1.2M LOC · 4,200 programs</div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {HEAT_MODULES.map((m, i) => (
            <motion.div key={m.name}
              className="relative bg-white/5 border border-white/10 rounded-xl px-4 py-3 overflow-hidden"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: phase > i ? 1 : 0, scale: phase > i ? 1 : 0.85 }}
              transition={{ type: 'spring', damping: 18 }}>
              <div className="absolute inset-y-0 left-0 w-1" style={{ background: riskColor(m.risk) }} />
              <div className="text-[0.85vw] text-white/85 font-mono truncate">{m.name}</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[0.7vw] text-white/40">CICS · {m.cics}</span>
                <span className="text-[1.4vw] font-black" style={{ color: riskColor(m.risk) }}>{m.risk}</span>
              </div>
              <div className="text-[0.65vw] text-white/35 mt-0.5">{m.loc.toLocaleString()} LOC</div>
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
  const tasks = [
    { label: 'COBOL paragraphs parsed', mult: 1.0 },
    { label: 'CICS transactions mapped', mult: 0.85 },
    { label: 'DB2 schemas resolved', mult: 0.72 },
    { label: 'Modern requirements drafted', mult: 0.58 },
  ];
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Extracting Requirements</motion.div>
      <div className="w-[62vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="text-[1.4vw] font-semibold mb-5 text-white/90">Decoding Mercury into modern reqs…</div>
        <div className="space-y-4">
          {tasks.map((t, i) => {
            const v = Math.min(100, Math.round(pct * t.mult));
            return (
              <div key={t.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[1vw] text-white/65">{t.label}</span>
                  <span className="text-[1vw] text-[var(--color-accent)] font-mono">{v}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'var(--color-accent)' }}
                    animate={{ width: `${v}%` }} transition={{ duration: 0.1 }} />
                </div>
              </div>
            );
          })}
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

export function ModuleLegacy() {
  const { currentSceneKey } = useVideoPlayer({ durations: SCENE_DURATIONS, loop: true });
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
      <BackgroundMusic />
      <AppShell slug="legacy" story={story} currentScene={currentSceneKey} />
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
