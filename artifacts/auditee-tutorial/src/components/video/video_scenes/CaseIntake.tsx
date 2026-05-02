import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const lines = [
  { t: 'User', text: 'We need to launch a UPI-based mobile payments feature.' },
  { t: 'User', text: 'It must comply with PCI DSS 4.0 from day one.' },
  { t: 'User', text: 'Target: 100k transactions per day, real-time fraud checks.' },
];

export function CaseIntake() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4200),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[6vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
      >
        Case Study · Acme Bank · PCI DSS 4.0
      </motion.div>
      <motion.h2
        className="text-[3.6vw] font-bold mb-10 text-center leading-tight"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
        transition={{ duration: 0.6 }}
      >
        From a conversation, not a 200-page spec.
      </motion.h2>

      <div className="w-[64vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2.4vw] shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div className="ml-3 text-[1vw] text-white/40 font-mono">auditee.site / app / interview</div>
        </div>

        <div className="space-y-4">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: phase >= i + 2 ? 1 : 0, y: phase >= i + 2 ? 0 : 20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center text-[1vw] font-bold text-[var(--color-accent)] shrink-0">
                AB
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-5 py-3 text-[1.4vw] text-white/90 max-w-full">
                {l.text}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
