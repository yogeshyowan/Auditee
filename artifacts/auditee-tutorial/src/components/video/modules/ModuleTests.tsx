import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Test Cases — AI-generated verification plans aligned to your standards." },
  { startMs: 5000,  endMs: 12000, text: "For every requirement, Auditee generates the test cases required by ISO 26262, IEC 62304, or any other active framework." },
  { startMs: 12000, endMs: 18000, text: "Export directly to TestRail, Xray, qTest, or Azure Test Plans in one click." },
  { startMs: 18000, endMs: 23000, text: "From specification to verified test coverage — automatically." },
];

const tests = [
  { id: 'TC-001', req: 'BRS-001', title: 'Verify brake actuation latency ≤ 10ms', std: 'ISO 26262', status: 'Pass' },
  { id: 'TC-002', req: 'PRD-014', title: 'Sensor fusion latency under 100% CPU load', std: 'ISO 26262', status: 'Fail' },
  { id: 'TC-003', req: 'FRD-031', title: 'Audit log encrypted with AES-256-GCM', std: 'IEC 62304', status: 'Pass' },
  { id: 'TC-004', req: 'BRS-007', title: 'Fail-safe activates within 5ms of ECU fault', std: 'ISO 26262', status: 'Pending' },
];

const statusColors: Record<string, string> = { Pass: '#34d399', Fail: '#f87171', Pending: '#94a3b8' };

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · Test Cases
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        AI-generated tests
        <br /><span style={{ color: 'var(--color-accent)' }}>aligned to your standards.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Every requirement gets the tests its standard demands — no manual spec-reading required.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = tests.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 1200));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Test Plan</motion.div>
      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/tests</div>
        </div>
        <div className="space-y-2.5">
          {tests.map((t, i) => (
            <motion.div key={t.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 14, scale: phase > i ? 1 : 0.97 }}
              transition={{ type: 'spring', damping: 18 }}>
              <span className="text-[0.85vw] font-mono text-[var(--color-accent)] shrink-0 w-[5vw]">{t.id}</span>
              <span className="text-[0.8vw] font-mono text-white/40 shrink-0 w-[5vw]">{t.req}</span>
              <span className="flex-1 text-[1.05vw] text-white/90">{t.title}</span>
              <span className="text-[0.8vw] text-white/40 shrink-0">{t.std}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColors[t.status] }} />
              <span className="text-[0.8vw] shrink-0" style={{ color: statusColors[t.status] }}>{t.status}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex gap-6 text-[0.9vw] text-white/40">
          <span className="text-[#34d399]">312 pass</span><span>·</span><span className="text-[#f87171]">18 fail</span><span>·</span><span>24 pending</span>
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const exports = ['TestRail', 'Xray', 'qTest', 'Azure Test Plans'];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = exports.map((_, i) => setTimeout(() => setPhase(i + 1), 400 + i * 900));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · One-Click Export</motion.div>
      <div className="grid grid-cols-2 gap-4 w-[50vw]">
        {exports.map((e, i) => (
          <motion.div key={e} className="bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: phase > i ? 1 : 0, scale: phase > i ? 1 : 0.85 }}
            transition={{ type: 'spring', damping: 16 }}>
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]" />
            </div>
            <span className="text-[1.2vw] font-semibold text-white/90">{e}</span>
            {phase > i && (
              <motion.span className="ml-auto text-[0.85vw] text-[#34d399]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Ready
              </motion.span>
            )}
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
        <div className="text-[7vw] font-black text-[var(--color-accent)]">312</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Test Cases Generated</div>
        <div className="text-[1.2vw] text-white/40 mt-3">Standards-aligned · export-ready</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleTests() {
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
