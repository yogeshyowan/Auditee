import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 8500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const pillars = [
    "Agentic AI Product Management",
    "Legacy Code Modernization",
    "Autonomous Compliance (23+ Frameworks)",
    "One Source of Truth"
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="absolute w-[80vw] h-[80vw] border border-[var(--color-accent)] rounded-full opacity-20"
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      <motion.h2 
        className="text-[3vw] text-[var(--color-text-secondary)] font-medium mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -20 }}
      >
        The Solution
      </motion.h2>

      <motion.h1 
        className="text-[7vw] font-bold text-gradient leading-none mb-12 tracking-tight"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.8 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        Auditee
      </motion.h1>

      <motion.p 
        className="text-[2vw] max-w-[60vw] text-center text-[var(--color-text-primary)] mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        Ship enterprise software with total clarity — from idea to audit.
      </motion.p>

      <div className="flex gap-6 w-[80vw] justify-center flex-wrap">
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            className="px-6 py-3 rounded-full border border-[var(--color-accent-alt)] bg-[var(--color-accent-alt)]/10 backdrop-blur-sm text-[1.2vw] font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 20 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            {pillar}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
