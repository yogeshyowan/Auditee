import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const imgBA = `${import.meta.env.BASE_URL}images/ba_stressed.png`;
const imgCTO = `${import.meta.env.BASE_URL}images/cto_overwhelmed.png`;
const imgCompliance = `${import.meta.env.BASE_URL}images/compliance_frantic.png`;

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 3500),
      setTimeout(() => setPhase(2), 9000),
      setTimeout(() => setPhase(3), 11000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(248,113,113,0.06) 0%, var(--color-bg-dark) 70%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 flex items-center justify-around px-10">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 50, rotate: -5 }}
          animate={{ opacity: 1, y: 0, rotate: [-2, -3, -2] }}
          transition={{
            opacity: { duration: 0.5, delay: 0.5 },
            y: { type: 'spring', stiffness: 300, damping: 20, delay: 0.5 },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }}
        >
          <img src={imgBA} className="w-64 h-64 object-contain sketch-border sketch-shadow p-2" alt="Stressed BA" />
          <motion.div
            className="mt-4 text-3xl font-display text-red-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            Hunting context...
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 50, rotate: 5 }}
          animate={phase >= 2 ? { opacity: 1, y: 0, rotate: [3, 4, 3] } : { opacity: 0, y: 50, rotate: 5 }}
          transition={phase >= 2 ? {
            opacity: { duration: 0.5 },
            y: { type: 'spring', stiffness: 300, damping: 20 },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          } : { type: 'spring', stiffness: 300, damping: 20 }}
        >
          <img src={imgCompliance} className="w-64 h-64 object-contain sketch-border sketch-shadow p-2" alt="Frantic Compliance" />
          <motion.div
            className="mt-4 text-3xl font-display text-orange-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
          >
            Audit nightmares!
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 50, rotate: -3 }}
          animate={phase >= 3 ? { opacity: 1, y: 0, rotate: [-5, -6, -5] } : { opacity: 0, y: 50, rotate: -3 }}
          transition={phase >= 3 ? {
            opacity: { duration: 0.5 },
            y: { type: 'spring', stiffness: 300, damping: 20 },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          } : { type: 'spring', stiffness: 300, damping: 20 }}
        >
          <img src={imgCTO} className="w-64 h-64 object-contain sketch-border sketch-shadow p-2" alt="Overwhelmed CTO" />
          <motion.div
            className="mt-4 text-3xl font-display text-white/50"
            initial={{ opacity: 0, scale: 0 }}
            animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
          >
            Releases slipping...
          </motion.div>
        </motion.div>
      </div>
      
      <motion.svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 1920 1080">
        <motion.path
          d="M 100 100 C 300 50, 500 150, 800 100 C 1200 50, 1500 200, 1800 100"
          fill="none"
          stroke="#f87171"
          strokeWidth="4"
          strokeDasharray="20 10"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
        <motion.path
          d="M 100 900 C 400 950, 800 850, 1200 950 C 1500 1000, 1700 850, 1800 900"
          fill="none"
          stroke="#fb923c"
          strokeWidth="4"
          strokeDasharray="15 15"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 5, ease: "easeInOut", delay: 1 }}
        />
      </motion.svg>
    </motion.div>
  );
}
