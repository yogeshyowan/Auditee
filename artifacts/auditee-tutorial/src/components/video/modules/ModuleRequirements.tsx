import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Requirements — your single source of truth for every specification." },
  { startMs: 5000,  endMs: 12000, text: "Every requirement auto-tagged to the standards it satisfies — ISO 26262, IEC 62304, HIPAA, and more." },
  { startMs: 12000, endMs: 18000, text: "Edit, baseline, version, and export to your RM tool in one click." },
  { startMs: 18000, endMs: 23000, text: "Fully traceable from requirement to code to test to audit." },
];

const reqs = [
  { id: 'BRS-001', kind: 'BRS', title: 'Emergency brake ≤ 10 ms', tag: 'ASIL D', status: 'verified' },
  { id: 'PRD-014', kind: 'PRD', title: 'Real-time sensor fusion', tag: 'Functional', status: 'approved' },
  { id: 'FRD-031', kind: 'FRD', title: 'Encrypted audit log per event', tag: 'ISO 26262', status: 'in_review' },
  { id: 'BRS-007', kind: 'BRS', title: 'Fail-safe fallback on ECU fault', tag: 'Safety', status: 'approved' },
];

const statusColors: Record<string, string> = {
  verified: '#34d399',
  approved: '#38bdf8',
  in_review: '#fb923c',
  draft: '#94a3b8',
};

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · Requirements
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        Every specification,
        <br /><span style={{ color: 'var(--color-accent)' }}>standards-tagged and versioned.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        BRS, PRD, and FRD requirements with full provenance, baselines, and export in one view.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = reqs.map((_, i) => setTimeout(() => setPhase(i + 1), 300 + i * 1100));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Requirements Table</motion.div>
      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/requirements</div>
        </div>
        <div className="space-y-2.5">
          {reqs.map((r, i) => (
            <motion.div key={r.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 16, scale: phase > i ? 1 : 0.95 }}
              transition={{ type: 'spring', damping: 18 }}>
              <span className="text-[0.9vw] font-mono text-[var(--color-accent)] w-[6vw] shrink-0">{r.id}</span>
              <span className="flex-1 text-[1.05vw] text-white/90">{r.title}</span>
              <span className="text-[0.8vw] px-2 py-0.5 rounded-full bg-[var(--color-accent-alt)]/20 text-[var(--color-accent-alt)] shrink-0">{r.kind}</span>
              <span className="text-[0.8vw] px-2 py-0.5 rounded-full bg-white/10 text-white/60 shrink-0">{r.tag}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColors[r.status] }} />
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex gap-6 text-[0.95vw] text-white/40">
          <span>247 total</span><span>·</span><span>18 unverified</span><span>·</span><span>4 standards covered</span>
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const standards = ['ISO 26262', 'IEC 62304', 'IEC 62443', 'ASPICE'];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = standards.map((_, i) => setTimeout(() => setPhase(i + 1), 400 + i * 900));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Standards Mapping</motion.div>
      <div className="grid grid-cols-2 gap-4 w-[58vw]">
        {standards.map((s, i) => (
          <motion.div key={s} className="bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[1.6vw]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: phase > i ? 1 : 0, scale: phase > i ? 1 : 0.85 }}
            transition={{ type: 'spring', damping: 16 }}>
            <div className="text-[1.3vw] font-bold text-white mb-2">{s}</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
              <motion.div className="h-full rounded-full" style={{ background: 'var(--color-accent)' }}
                initial={{ width: '0%' }} animate={{ width: phase > i ? `${72 + i * 7}%` : '0%' }}
                transition={{ duration: 1, delay: 0.3 }} />
            </div>
            <div className="text-[0.9vw] text-white/50">{72 + i * 7}% coverage</div>
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
        <div className="text-[7vw] font-black text-[var(--color-accent)]">247</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Requirements Tracked</div>
        <div className="text-[1.2vw] text-white/40 mt-3">Baselined · versioned · export-ready</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleRequirements() {
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
