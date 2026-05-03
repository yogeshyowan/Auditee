import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { BackgroundMusic } from '../BackgroundMusic';
import { TimedCaptions, TimedCue } from '../TimedCaptions';

const SCENE_DURATIONS = { scene1: 5000, scene2: 7000, scene3: 6000, scene4: 5000 };
const TOTAL_MS = 23000;

const CUES: TimedCue[] = [
  { startMs: 0,     endMs: 5000,  text: "Step ten. Acme needs a Design History File for the FDA 510(k) submission." },
  { startMs: 5000,  endMs: 12000, text: "One click. 247-page DHF generated in four minutes — every section pulled from live reqs, tests, and risk file." },
  { startMs: 12000, endMs: 18000, text: "Safety Plan, HARA, post-market surveillance, audit packet — pick any, generate, sign." },
  { startMs: 18000, endMs: 23000, text: "Weeks of manual writing — done. Ready for the FDA reviewer." },
];

const reportTypes = [
  { name: 'Safety Plan', std: 'ISO 26262', pages: 42 },
  { name: 'HARA', std: 'ISO 26262', pages: 28 },
  { name: 'Technical Safety Concept', std: 'ISO 26262', pages: 67 },
  { name: 'TARA', std: 'ISO/SAE 21434', pages: 35 },
  { name: 'Cybersecurity Plan', std: 'IEC 62443', pages: 51 },
  { name: 'Audit Packet', std: 'SOC 2', pages: 89 },
];

function Scene1() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        Step 01 · AI Reports
      </motion.div>
      <motion.h2 className="text-[4vw] font-black text-center leading-tight mb-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', damping: 20 }}>
        Audit documents
        <br /><span style={{ color: 'var(--color-accent)' }}>in one click.</span>
      </motion.h2>
      <motion.p className="text-[1.4vw] text-white/60 text-center max-w-[50vw]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        Safety Plans, HARA, TARA, Cybersecurity Plans — generated from your live project graph, not a blank template.
      </motion.p>
    </motion.div>
  );
}

function Scene2() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = reportTypes.map((_, i) => setTimeout(() => setPhase(i + 1), 200 + i * 700));
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 02 · Report Library</motion.div>
      <div className="w-[76vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site/app/reports</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {reportTypes.map((r, i) => (
            <motion.div key={r.name} className="bg-white/5 border border-white/10 rounded-xl p-4"
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: phase > i ? 1 : 0, y: phase > i ? 0 : 16, scale: phase > i ? 1 : 0.9 }}
              transition={{ type: 'spring', damping: 18 }}>
              <div className="text-[1.05vw] font-semibold text-white/90 mb-1">{r.name}</div>
              <div className="text-[0.85vw] text-[var(--color-accent)] mb-2">{r.std}</div>
              <div className="text-[0.8vw] text-white/40">{r.pages} pages · auto-generated</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Scene3() {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const sections = ['Cover page & executive summary', 'Requirements coverage matrix', 'Safety goals & ASIL assignments', 'Findings & CAPA evidence'];
  const [secPhase, setSecPhase] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / 4000) * 100));
      setPct(p);
      setSecPhase(Math.floor(p / 25));
      if (p >= 100) { setDone(true); clearInterval(id); }
    }, 60);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Step 03 · Generating Safety Plan…</motion.div>
      <div className="w-[62vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div className="h-full rounded-full" style={{ background: done ? '#34d399' : 'var(--color-accent)' }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.1 }} />
        </div>
        <div className="space-y-2.5">
          {sections.map((s, i) => (
            <motion.div key={s} className="flex items-center gap-3 text-[1vw]"
              animate={{ opacity: secPhase > i ? 1 : 0.3 }}>
              <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                style={{ borderColor: secPhase > i ? '#34d399' : 'rgba(255,255,255,0.2)', background: secPhase > i ? '#34d39920' : 'transparent' }}>
                {secPhase > i && <div className="w-2 h-2 rounded-full bg-[#34d399]" />}
              </div>
              <span style={{ color: secPhase > i ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}>{s}</span>
            </motion.div>
          ))}
        </div>
        {done && <motion.div className="mt-4 text-[0.9vw] text-[#34d399] font-semibold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Safety Plan ready — 42 pages · PDF + DOCX</motion.div>}
      </div>
    </motion.div>
  );
}

function Scene4() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <motion.div className="text-center" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
        <div className="text-[7vw] font-black text-[var(--color-accent)]">42</div>
        <div className="text-[2vw] font-semibold text-white/80 -mt-2">Pages Generated</div>
        <div className="text-[1.2vw] text-white/40 mt-3">Safety Plan · 100% from live project data</div>
      </motion.div>
    </motion.div>
  );
}

export function ModuleReports() {
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
