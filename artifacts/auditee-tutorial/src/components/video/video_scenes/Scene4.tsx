import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
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

  const outcomes = [
    { title: "Audit-Ready", color: "#10B981" },
    { title: "Fully Traceable", color: "#3B82F6" },
    { title: "Continuously Compliant", color: "#8B5CF6" },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 
        className="text-[2.5vw] text-[var(--color-text-secondary)] font-medium mb-12 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
      >
        The Result
      </motion.h2>

      <div className="flex flex-col gap-8 items-center w-full">
        {outcomes.map((o, i) => (
          <motion.div 
            key={i}
            className="flex items-center gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: phase >= i + 1 ? 1 : 0, y: phase >= i + 1 ? 0 : 30 }}
            transition={{ type: 'spring', damping: 15, delay: i * 0.2 }}
          >
            <div className="w-12 h-12 rounded-full" style={{ backgroundColor: o.color, boxShadow: `0 0 30px ${o.color}` }} />
            <h1 className="text-[5vw] font-bold tracking-tight">{o.title}</h1>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
