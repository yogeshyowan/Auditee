import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const imgDashboard = `${import.meta.env.BASE_URL}images/dashboard_sketch.png`;

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => setPhase(2), 8000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'radial-gradient(circle at 50% 40%, rgba(167,139,250,0.1) 0%, var(--color-bg-dark) 70%)' }}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10">
        
        <motion.h1 
          className="text-8xl font-display text-white/90 font-bold"
          initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
        >
          Meet <span className="text-violet-400">Auditee.</span>
        </motion.h1>

        <motion.div
          className="mt-8 text-3xl font-body text-white/60 text-center max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          The AI-native control plane for the product development lifecycle.
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, y: [0, -5, 0] } : { opacity: 0, y: 50 }}
          transition={phase >= 2 ? {
            opacity: { duration: 0.5 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          } : { type: 'spring', bounce: 0.4 }}
        >
          <img src={imgDashboard} className="w-[40rem] h-auto object-contain sketch-border sketch-shadow p-2" alt="Dashboard Sketch" />
        </motion.div>

      </div>
    </motion.div>
  );
}
