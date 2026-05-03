import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const teamHappy = `${import.meta.env.BASE_URL}images/team_happy.png`;

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 5500),
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
      className="absolute inset-0 flex items-center justify-center gap-[6vw] px-[10vw]"
      initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col flex-1">
        <motion.h2 
          className="text-[2.5vw] text-[var(--color-text-secondary)] font-medium mb-12 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          The Result
        </motion.h2>

        <div className="flex flex-col gap-8 w-full">
          {outcomes.map((o, i) => (
            <motion.div 
              key={i}
              className="flex items-center gap-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: phase >= i + 1 ? 1 : 0, x: phase >= i + 1 ? 0 : -30 }}
              transition={{ type: 'spring', damping: 15, delay: i * 0.2 }}
            >
              <div className="w-12 h-12 rounded-full shrink-0" style={{ backgroundColor: o.color, boxShadow: `0 0 30px ${o.color}` }} />
              <h1 className="text-[4vw] font-bold tracking-tight">{o.title}</h1>
            </motion.div>
          ))}
        </div>
      </div>
      
      <motion.div
        className="flex-1 relative"
        initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
        animate={{ opacity: phase >= 3 ? 1 : 0, scale: 1, rotate: -2 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <img src={teamHappy} className="w-[30vw] object-contain sketch-border sketch-shadow p-2 bg-white/10 rounded-[3rem] backdrop-blur-md" alt="Team Happy" />
        <motion.div
          className="absolute -bottom-6 -left-6 bg-emerald-500 text-white font-bold text-2xl px-6 py-3 rounded-full shadow-2xl"
          animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Shipped! 🚀
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
