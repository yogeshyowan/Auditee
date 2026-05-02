import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PRICING = `${import.meta.env.BASE_URL}site/pricing.jpg`;

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src={PRICING}
        alt="Pricing"
        className="absolute inset-0 w-full h-full object-cover opacity-10 blur-sm"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: phase >= 1 ? 0.12 : 0, scale: 1 }}
        transition={{ duration: 1.2 }}
      />

      <motion.div
        className="text-[8vw] font-black text-gradient leading-none tracking-tighter mb-4 relative"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: phase >= 1 ? 1 : 0.85, opacity: phase >= 1 ? 1 : 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        Auditee
      </motion.div>

      <motion.div
        className="text-[2.4vw] text-white font-medium mb-3 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
      >
        auditee.site
      </motion.div>

      <motion.div
        className="text-[1.3vw] text-white/70 mb-10 italic relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
        transition={{ delay: 0.15 }}
      >
        Ship enterprise software with total clarity.
      </motion.div>

      <motion.div
        className="flex gap-6 text-[1.1vw] text-[var(--color-text-secondary)] bg-white/5 px-8 py-4 rounded-full border border-white/10 backdrop-blur-sm relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 20 }}
        transition={{ delay: 0.25 }}
      >
        <span>Free</span>
        <span className="text-white/20">|</span>
        <span>Standard <span className="text-white/85 font-bold">₹1,999</span></span>
        <span className="text-white/20">|</span>
        <span>Professional <span className="text-white/85 font-bold">₹7,999</span></span>
        <span className="text-white/20">|</span>
        <span>Enterprise</span>
      </motion.div>
    </motion.div>
  );
}
