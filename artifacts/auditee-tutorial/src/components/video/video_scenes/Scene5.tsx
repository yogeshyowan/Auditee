import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-[8vw] font-black text-gradient leading-none tracking-tighter mb-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: phase >= 1 ? 1 : 0.8, opacity: phase >= 1 ? 1 : 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        Auditee
      </motion.div>

      <motion.div 
        className="text-[3vw] text-white font-medium mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
      >
        auditee.site
      </motion.div>

      <motion.div 
        className="flex gap-8 text-[1.2vw] text-[var(--color-text-secondary)] bg-white/5 px-8 py-4 rounded-full border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
        transition={{ delay: 0.2 }}
      >
        <span>Free</span>
        <span className="text-white/20">|</span>
        <span>Standard ₹1,999</span>
        <span className="text-white/20">|</span>
        <span>Professional ₹7,999</span>
        <span className="text-white/20">|</span>
        <span>Enterprise</span>
      </motion.div>
    </motion.div>
  );
}
