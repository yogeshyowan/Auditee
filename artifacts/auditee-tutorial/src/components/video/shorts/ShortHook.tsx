import { motion } from 'framer-motion';
import type { ShortHook as Hook } from '@/lib/shortsConfig';

export function ShortHook({ hook }: { hook: Hook }) {
  return (
    <motion.div
      key="hook"
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: `radial-gradient(circle at 50% 30%, ${hook.accent}33 0%, #0b0f1a 70%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="text-[18vw] mb-2"
        initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 0.05 }}
      >
        {hook.emoji}
      </motion.div>
      <motion.div
        className="text-[7vw] font-black leading-[1.05] tracking-tight max-w-[90%]"
        style={{ color: 'white', textShadow: `0 0 30px ${hook.accent}88` }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', damping: 18 }}
      >
        {hook.punch}
      </motion.div>
      <motion.div
        className="mt-6 text-[4.2vw] font-medium text-white/80 max-w-[88%] leading-snug"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
      >
        {hook.setup}
      </motion.div>
      <motion.div
        className="absolute bottom-[8vh] flex items-center gap-2 text-white/60 text-[3.5vw] font-bold"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.5 }}
      >
        <span>👇 watch</span>
      </motion.div>
    </motion.div>
  );
}
