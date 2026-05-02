import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const stats = [
  { v: '6 weeks → 4 days', l: 'Time-to-audit-ready' },
  { v: '94%', l: 'PCI DSS coverage' },
  { v: '0', l: 'Surprises in production' },
];

export function CaseConclude() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      ...stats.map((_, i) => setTimeout(() => setPhase(2 + i), 800 + i * 700)),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}>
        Acme Bank · Outcome
      </motion.div>
      <motion.h2 className="text-[3.6vw] font-bold mb-12 text-center leading-tight max-w-[80vw]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}>
        Conversation → compliant release.<br/>
        <span className="text-gradient">Days, not months.</span>
      </motion.h2>

      <div className="grid grid-cols-3 gap-8 w-[78vw]">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            className="text-center p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: phase >= i + 2 ? 1 : 0, y: phase >= i + 2 ? 0 : 30 }}
            transition={{ type: 'spring', damping: 18 }}
          >
            <div className="text-[3vw] font-black text-gradient leading-none mb-2">{s.v}</div>
            <div className="text-[1vw] text-white/60 uppercase tracking-wider">{s.l}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
