import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
      setTimeout(() => setPhase(4), 6500),
      setTimeout(() => setPhase(5), 9000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const problems = [
    { num: "01", text: "Hunting for context", sub: "Teams waste 40-50% of time across repos" },
    { num: "02", text: "Compliance stalls", sub: "Audits become nightmares" },
    { num: "03", text: "Release uncertainty", sub: "What features are truly complete?" },
    { num: "04", text: "Legacy paralysis", sub: "Decades of old code holding you back" },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-[4vw] font-bold mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
        transition={{ duration: 0.8 }}
      >
        Enterprise Software is <span className="text-[#EF4444]">Broken</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-8 w-[70vw]">
        {problems.map((p, i) => (
          <motion.div 
            key={i}
            className="bg-[var(--color-bg-muted)] border border-white/10 p-8 rounded-2xl"
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40, scale: 0.9 }}
            animate={{ 
              opacity: phase > i ? 1 : 0, 
              x: phase > i ? 0 : (i % 2 === 0 ? -40 : 40),
              scale: phase > i ? 1 : 0.9
            }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
          >
            <div className="text-[var(--color-accent)] text-[1.5vw] font-mono mb-2">{p.num}</div>
            <div className="text-[2vw] font-bold mb-2">{p.text}</div>
            <div className="text-[1.2vw] text-[var(--color-text-secondary)]">{p.sub}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
