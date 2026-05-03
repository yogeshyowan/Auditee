import { motion } from 'framer-motion';
import {
  FULL_VIDEO_HOOK, FULL_VIDEO_INTRO, FULL_VIDEO_CLOSURE,
  CTA_COPY, MODULE_ORDER, SHORT_HOOKS,
} from '@/lib/shortsConfig';
import { getStory } from '@/lib/demoUseCases';

export function FullHookScene() {
  return (
    <motion.div
      key="full-hook"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8vw]"
      style={{ background: 'radial-gradient(circle at 50% 40%, #2a0f3a 0%, #0b0f1a 70%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-[1.5vw] uppercase tracking-[0.4em] text-rose-400 mb-6"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      >
        ⚠ The painful truth
      </motion.div>
      <motion.div
        className="text-[5.5vw] font-black leading-[1.05] text-white max-w-[90%]"
        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 18, delay: 0.4 }}
      >
        {FULL_VIDEO_HOOK.pain}
      </motion.div>
      <motion.div
        className="mt-10 text-[3.5vw] font-bold text-amber-300"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        {FULL_VIDEO_HOOK.twist}
      </motion.div>
    </motion.div>
  );
}

export function FullIntroScene() {
  return (
    <motion.div
      key="full-intro"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8vw]"
      style={{ background: 'linear-gradient(135deg, #0b0f1a 0%, #1e1b4b 100%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-[8vw] font-black tracking-tight"
        style={{
          background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
      >
        {FULL_VIDEO_INTRO.brand}
      </motion.div>
      <motion.div
        className="mt-2 text-[2.4vw] text-white font-medium"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        {FULL_VIDEO_INTRO.pitch}
      </motion.div>
      <div className="mt-12 flex flex-col gap-4 text-left">
        {FULL_VIDEO_INTRO.bullets.map((b, i) => (
          <motion.div
            key={b}
            className="flex items-start gap-3 text-[2vw] text-white/85"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.5 }}
          >
            <span className="text-[var(--color-accent)] font-bold">›</span>
            <span>{b}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ChapterTitle({ index, slug }: { index: number; slug: typeof MODULE_ORDER[number] }) {
  const story = getStory(slug);
  const hook = SHORT_HOOKS[slug];
  return (
    <motion.div
      key={`chapter-${slug}`}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8vw]"
      style={{ background: `radial-gradient(circle at 50% 50%, ${hook.accent}26 0%, #0b0f1a 70%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-[1.4vw] uppercase tracking-[0.4em] mb-6"
        style={{ color: hook.accent }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      >
        Chapter {String(index + 1).padStart(2, '0')} of {MODULE_ORDER.length}
      </motion.div>
      <motion.div
        className="text-[10vw] mb-2"
        initial={{ scale: 0.5 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
      >
        {hook.emoji}
      </motion.div>
      <motion.div
        className="text-[5vw] font-black leading-[1.05] text-white max-w-[80%]"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {story.project}
      </motion.div>
      <motion.div
        className="mt-4 text-[2.4vw] text-white/70 max-w-[70%]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      >
        {hook.punch}
      </motion.div>
    </motion.div>
  );
}

export function FullClosureScene() {
  return (
    <motion.div
      key="full-closure"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8vw]"
      style={{ background: 'radial-gradient(circle at 50% 30%, #134e4a 0%, #0b0f1a 70%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-[5.5vw] font-black text-white leading-tight"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        {FULL_VIDEO_CLOSURE.headline}
      </motion.div>
      <motion.div
        className="mt-4 text-[2vw] text-white/70 max-w-[70%]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        {FULL_VIDEO_CLOSURE.sub}
      </motion.div>
      <motion.a
        href="https://auditee.site"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex items-center gap-3 rounded-full px-12 py-6 text-[2.8vw] font-black text-slate-950 shadow-2xl"
        style={{ background: 'linear-gradient(90deg, #a78bfa, #38bdf8)' }}
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, delay: 1.4 }}
      >
        {CTA_COPY.cta}
      </motion.a>
      <motion.div
        className="mt-8 text-[2.5vw] text-white/85 font-bold tracking-wide"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}
      >
        🌐 {FULL_VIDEO_CLOSURE.cta}
      </motion.div>
    </motion.div>
  );
}
