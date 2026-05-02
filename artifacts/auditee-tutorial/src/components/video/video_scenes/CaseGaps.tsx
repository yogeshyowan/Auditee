import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const gaps = [
  { id: 'GAP-01', text: 'Required: Cardholder data masking in receipts', ctrl: 'PCI 3.3.1' },
  { id: 'GAP-02', text: 'Required: Quarterly key-rotation procedure', ctrl: 'PCI 3.6.4' },
  { id: 'GAP-03', text: 'Required: Penetration test before launch', ctrl: 'PCI 11.4.3' },
];

export function CaseGaps() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      ...gaps.map((_, i) => setTimeout(() => setPhase(2 + i), 1500 + i * 1500)),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-red-400 mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}>
        Step 05 · Missing Requirements Detected
      </motion.div>
      <motion.h2 className="text-[2.8vw] font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}>
        3 critical gaps surfaced before release
      </motion.h2>

      <div className="w-[68vw] space-y-4">
        {gaps.map((g, i) => (
          <motion.div
            key={g.id}
            className="bg-red-500/10 border-l-4 border-red-400 rounded-r-xl p-4 flex items-center gap-5"
            initial={{ opacity: 0, x: -30 }}
            animate={{
              opacity: phase >= i + 2 ? 1 : 0,
              x: phase >= i + 2 ? 0 : -30,
            }}
            transition={{ type: 'spring', damping: 18 }}
          >
            <div className="text-[2vw] font-mono text-red-400 shrink-0">!</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-[0.95vw] text-red-300">{g.id}</span>
                <span className="text-[0.85vw] px-2 py-0.5 rounded-md bg-white/10 text-white/70 font-mono">{g.ctrl}</span>
              </div>
              <div className="text-[1.3vw] text-white/95">{g.text}</div>
            </div>
            <div className="text-[0.9vw] uppercase tracking-wider text-red-300/80 font-mono shrink-0">missing</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
