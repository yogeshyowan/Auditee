import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';
import { getStory } from '@/lib/demoUseCases';

const story = getStory('dashboard');
const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = story.cues;

const rings = [
  { label: 'HIPAA', pct: 92, color: '#a78bfa' },
  { label: 'DPDP', pct: 88, color: '#38bdf8' },
  { label: 'SOC 2', pct: 87, color: '#34d399' },
];

const healthCards = [
  { label: 'Open Gaps', val: '4', severity: 'high', color: '#f87171' },
  { label: 'Open CAPAs', val: '2', severity: 'medium', color: '#fb923c' },
  { label: 'Evidence Fresh', val: '96%', severity: 'good', color: '#34d399' },
  { label: 'Days to Audit', val: '14', severity: 'neutral', color: '#38bdf8' },
];

function Ring({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 36, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="14" fontWeight="700">{pct}%</text>
      </svg>
      <span className="text-[0.85vw] text-white/60 text-center">{label}</span>
    </div>
  );
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
    const ts = [...healthCards, ...rings].map((_, i) => setTimeout(() => setPhase(i + 1), 200 + i * 700));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Project Dashboard</motion.div>
      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/dashboard</div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="text-[0.9vw] text-white/50 mb-3 uppercase tracking-wide">Health Indicators</div>
            <div className="grid grid-cols-2 gap-3">
              {healthCards.map((c, i) => (
                <motion.div key={c.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: phase > i ? 1 : 0, scale: phase > i ? 1 : 0.85 }}
                  transition={{ type: 'spring', damping: 18 }}>
                  <div className="text-[0.85vw] text-white/50 mb-1">{c.label}</div>
                  <div className="text-[2.2vw] font-black" style={{ color: c.color }}>{c.val}</div>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[0.9vw] text-white/50 mb-3 uppercase tracking-wide">Framework Coverage</div>
            <div className="flex items-center justify-around h-full pb-4">
              {rings.map((r, i) => (
                <motion.div key={r.label}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: phase > healthCards.length + i ? 1 : 0, scale: phase > healthCards.length + i ? 1 : 0.7 }}
                  transition={{ type: 'spring', damping: 16 }}>
                  <Ring pct={r.pct} color={r.color} label={r.label} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const activity = [
  { time: '2h ago', msg: 'CAPA-003 closed by M. Liu', color: '#34d399' },
  { time: '4h ago', msg: 'Gap DEF-441 linked to BRS-007', color: '#38bdf8' },
  { time: '6h ago', msg: 'Safety Plan generated (42 pages)', color: '#a78bfa' },
];

function Scene3() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = activity.map((_, i) => setTimeout(() => setPhase(i + 1), 500 + i * 1400));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Activity Feed</motion.div>
      <div className="w-[62vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="text-[1.2vw] font-semibold text-white/80 mb-5">Recent activity</div>
        <div className="space-y-4">
          {activity.map((a, i) => (
            <motion.div key={i} className="flex items-center gap-4"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: phase > i ? 1 : 0, x: phase > i ? 0 : -16 }}
              transition={{ type: 'spring', damping: 20 }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
              <span className="flex-1 text-[1.1vw] text-white/90">{a.msg}</span>
              <span className="text-[0.85vw] text-white/40 shrink-0">{a.time}</span>
            </motion.div>
          ))}
        </div>
        <motion.div className="mt-6 p-4 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20"
          animate={{ opacity: phase >= activity.length ? 1 : 0 }} transition={{ duration: 0.5 }}>
          <div className="text-[0.9vw] text-[var(--color-accent)] font-semibold mb-1">Daily Summary Email</div>
          <div className="text-[0.85vw] text-white/60">Delivered every morning — what changed, what needs attention.</div>
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

export function ModuleDashboard() {
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
