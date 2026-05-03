import { motion } from 'framer-motion';
import { CTA_COPY, type ShortHook as Hook } from '@/lib/shortsConfig';

export function ShortCTA({ hook }: { hook: Hook }) {
  return (
    <motion.div
      key="cta"
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: `linear-gradient(160deg, #0b0f1a 0%, ${hook.accent}55 100%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-[5vw] font-bold mb-4"
        style={{ color: hook.accent }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {hook.payoff}
      </motion.div>
      <motion.div
        className="text-[8.5vw] font-black leading-[1] text-white tracking-tight"
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, delay: 0.4 }}
      >
        {CTA_COPY.headline}
      </motion.div>
      <motion.div
        className="mt-6 text-[4vw] text-white/85 max-w-[90%]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {CTA_COPY.sub}
      </motion.div>
      <motion.a
        href="https://auditee.site"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex items-center gap-3 rounded-full px-8 py-5 text-[5vw] font-black text-slate-950 shadow-2xl"
        style={{ background: hook.accent }}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, delay: 2 }}
      >
        {CTA_COPY.cta}
      </motion.a>
      <motion.div
        className="absolute bottom-[6vh] text-white/70 text-[4.5vw] font-bold tracking-wide"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        🌐 {CTA_COPY.url}
      </motion.div>
    </motion.div>
  );
}
