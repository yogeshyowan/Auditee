import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Step twelve. SmartInhaler programme dashboard — every metric, live." },
  { startMs: 5000,  endMs: 12000, text: "247 reqs tracked. 18 gaps closed. 87% audit-readiness. Trend sparklines show weekly progress." },
  { startMs: 12000, endMs: 18000, text: "Catch regressions before review — if coverage drops, Auditee pings Priya within minutes." },
  { startMs: 18000, endMs: 23000, text: "Export the whole view as a PDF for the Acme Health board meeting." },
];

const kpis = [
  { label: 'Audit Readiness', val: 84, delta: '+6%', color: '#a78bfa' },
  { label: 'Test Coverage', val: 91, delta: '+3%', color: '#38bdf8' },
  { label: 'CAPA Closure', val: 100, delta: '—', color: '#34d399' },
  { label: 'Traceability', val: 91, delta: '+4%', color: '#fb923c' },
];

const sparkData = [62, 68, 71, 69, 74, 78, 84];

function Sparkline({ vals, color }: { vals: number[]; color: string }) {
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const w = 80, h = 30;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · Analytics
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        Know your audit readiness
        <br /><span style={{ color: 'var(--color-accent)' }}>before the auditor does.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Live KPI tiles, trend sparklines, and exportable health reports — always current.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = kpis.map((_, i) => setTimeout(() => setPhase(i + 1), 200 + i * 1100));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · KPI Dashboard</motion.div>
      <div className="w-[76vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/analytics</div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20, scale: 0.88 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 20, scale: phase > i ? 1 : 0.88 }}
              transition={{ type: 'spring', damping: 18 }}>
              <div className="text-[0.85vw] text-white/50">{k.label}</div>
              <div className="text-[3vw] font-black leading-none" style={{ color: k.color }}>{k.val}%</div>
              <div className="flex items-center justify-between">
                <span className="text-[0.8vw] text-[#34d399]">{k.delta}</span>
                <Sparkline vals={sparkData} color={k.color} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
  const values = [62, 68, 71, 69, 74, 78, 84];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const ts = weeks.map((_, i) => setTimeout(() => setShown(i + 1), 300 + i * 600));
    return () => ts.forEach(clearTimeout);
  }, []);
  const maxVal = Math.max(...values);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Audit Readiness Trend</motion.div>
      <div className="w-[60vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="text-[1.2vw] font-semibold text-white/80 mb-4">Readiness score over 7 weeks</div>
        <div className="flex items-end gap-3 h-[22vh]">
          {weeks.map((w, i) => (
            <div key={w} className="flex-1 flex flex-col items-center gap-2">
              <motion.div className="w-full rounded-t-lg" style={{ background: 'var(--color-accent)', minHeight: 4 }}
                initial={{ height: 0 }} animate={{ height: shown > i ? `${(values[i] / maxVal) * 85}%` : 0 }}
                transition={{ duration: 0.5, type: 'spring', damping: 18 }} />
              <span className="text-[0.85vw] text-white/50">{w}</span>
              {shown > i && <span className="text-[0.75vw] text-[var(--color-accent)] font-mono">{values[i]}%</span>}
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
        <div className="text-[7vw] font-black text-[var(--color-accent)]">84%</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Audit Readiness</div>
        <div className="text-[1.2vw] text-white/40 mt-3">+6% this sprint · export PDF health report</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleAnalytics() {
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
