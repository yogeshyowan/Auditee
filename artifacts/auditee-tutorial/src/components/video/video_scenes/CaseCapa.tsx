import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const capas = [
  { id: 'CAPA-201', kind: 'Corrective', title: 'Mask PAN in all log statements', owner: 'eng:payments', due: '7d' },
  { id: 'CAPA-202', kind: 'Corrective', title: 'Add idempotency key to /charge', owner: 'eng:payments', due: '14d' },
  { id: 'CAPA-203', kind: 'Preventive', title: 'Quarterly key-rotation runbook', owner: 'sec:platform', due: '30d' },
];

export function CaseCapa() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      ...capas.map((_, i) => setTimeout(() => setPhase(2 + i), 1200 + i * 1500)),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}>
        Step 06 · CAPA auto-drafted
      </motion.div>
      <motion.h2 className="text-[2.8vw] font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}>
        Corrective + Preventive Actions, ready to assign
      </motion.h2>

      <div className="w-[74vw] grid grid-cols-3 gap-5">
        {capas.map((c, i) => (
          <motion.div
            key={c.id}
            className="bg-[var(--color-bg-muted)] border border-white/10 rounded-xl p-5 relative overflow-hidden"
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{
              opacity: phase >= i + 2 ? 1 : 0,
              y: phase >= i + 2 ? 0 : 30,
              rotate: phase >= i + 2 ? 0 : -2,
            }}
            transition={{ type: 'spring', damping: 18 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-alt)]" />
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[0.95vw] text-[var(--color-accent)]">{c.id}</span>
              <span className={`text-[0.8vw] uppercase tracking-wider px-2 py-0.5 rounded ${c.kind === 'Corrective' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {c.kind}
              </span>
            </div>
            <div className="text-[1.2vw] text-white/95 mb-4 leading-snug">{c.title}</div>
            <div className="flex items-center justify-between text-[0.85vw] text-white/60 font-mono pt-3 border-t border-white/10">
              <span>👤 {c.owner}</span>
              <span>⏱ {c.due}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
