import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SITE = `${import.meta.env.BASE_URL}site/home.jpg`;

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 6500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const pillars = [
    "Agentic AI Product Management",
    "Legacy Code Modernization",
    "Autonomous Compliance · 23+ Frameworks",
    "One Source of Truth"
  ];

  return (
    <motion.div
      className="absolute inset-0 flex p-[4vw] items-center justify-center gap-[3vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-[42%] flex flex-col">
        <motion.div
          className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-text-secondary)] mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
        >
          Meet Auditee
        </motion.div>

        <motion.h1
          className="text-[6vw] font-black text-gradient leading-[0.9] mb-6 tracking-tighter"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.85 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          Auditee
        </motion.h1>

        <motion.p
          className="text-[1.6vw] text-white/85 mb-6 leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
        >
          Ship enterprise software with total clarity — from idea to audit.
        </motion.p>

        <div className="flex flex-col gap-2.5">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-accent-alt)]/40 bg-[var(--color-accent-alt)]/10 text-[1.05vw] font-medium"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: phase >= 3 ? 1 : 0, x: phase >= 3 ? 0 : -20 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
            >
              {pillar}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        className="w-[52%] relative"
        initial={{ opacity: 0, scale: 0.92, x: 40 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, scale: phase >= 2 ? 1 : 0.92, x: phase >= 2 ? 0 : 40 }}
        transition={{ type: 'spring', damping: 22 }}
      >
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white">
          <div className="bg-slate-100 px-3 py-2 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="ml-3 text-[0.85vw] text-slate-500 font-mono">auditee.site</div>
          </div>
          <img src={SITE} alt="Auditee.site home" className="w-full block" />
        </div>
        <motion.div
          className="absolute -bottom-4 -right-4 px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg-dark)] font-bold text-[1vw] shadow-xl"
          initial={{ scale: 0 }}
          animate={{ scale: phase >= 3 ? 1 : 0 }}
          transition={{ type: 'spring', damping: 14 }}
        >
          Live · auditee.site
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
