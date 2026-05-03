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

  const imgBA = `${import.meta.env.BASE_URL}images/ba_stressed.png`;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[6vw] whiteboard-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-[1.5vw] uppercase tracking-[0.2em] font-display text-violet-500 mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
      >
        Case Study · Acme Bank · PCI DSS 4.0
      </motion.div>
      <motion.h2
        className="text-[3.6vw] font-display text-slate-800 font-bold mb-10 text-center leading-tight"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
        transition={{ duration: 0.6 }}
      >
        From a conversation, not a 200-page spec.
      </motion.h2>

      <div className="flex gap-[4vw] items-center">
        <motion.div
          initial={{ opacity: 0, x: -20, rotate: -5 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -20, rotate: phase >= 1 ? 2 : -5 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative"
        >
          <img src={imgBA} className="w-[20vw] object-contain sketch-border sketch-shadow p-2 bg-white/10 rounded-full backdrop-blur-md" alt="BA Engaged" />
          <motion.div
            className="absolute -top-4 -right-4 bg-violet-500 text-white font-bold text-xl px-4 py-2 rounded-full shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Typing...
          </motion.div>
        </motion.div>

        <div className="w-[44vw] bg-white border-2 border-slate-800 rounded-2xl p-[2.4vw] sketch-shadow sketch-border">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-4 h-4 rounded-full bg-red-400" />
            <div className="w-4 h-4 rounded-full bg-yellow-400" />
            <div className="w-4 h-4 rounded-full bg-green-400" />
            <div className="ml-3 text-[1vw] text-slate-400 font-mono">auditee.site / app / interview</div>
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
                <div className="w-12 h-12 rounded-full bg-violet-100 border-2 border-violet-400 flex items-center justify-center text-[1.2vw] font-bold text-violet-500 shrink-0 sketch-border">
                  AB
                </div>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl rounded-tl-none px-5 py-3 text-[1.4vw] font-body text-slate-700 max-w-full sketch-shadow">
                  {l.text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
