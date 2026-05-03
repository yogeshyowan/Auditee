import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const codeLines = [
  'export async function chargeCard(token, amountPaise) {',
  '  const card = await vault.detok(token);',
  '  log.info({ pan: card.number }, "charging card");',
  '  return gateway.charge(card, amountPaise);',
  '}',
];

const findings = [
  { sev: 'HIGH', text: 'PAN logged in cleartext (PCI 3.3.1)', color: '#EF4444' },
  { sev: 'MED', text: 'Missing idempotency key (PCI 6.4.1)', color: '#F59E0B' },
  { sev: 'LOW', text: 'No retry/backoff on gateway timeout', color: '#94A3B8' },
];

export function CaseAudit() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1500),
      ...findings.map((_, i) => setTimeout(() => setPhase(3 + i), 4000 + i * 1500)),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const imgCTO = `${import.meta.env.BASE_URL}images/cto_overwhelmed.png`;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}
      >
        Step 03 · Compliance Audit on Sample Code
      </motion.div>
      <motion.h2
        className="text-[2.6vw] font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
      >
        AI auditor running over <span className="font-mono text-[var(--color-accent-alt)]">payments/charge.ts</span>
      </motion.h2>

      <div className="grid grid-cols-2 gap-6 w-[80vw] relative">
        <motion.div
          className="bg-black/40 border border-white/10 rounded-xl p-5 font-mono text-[0.95vw] leading-relaxed"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -20 }}
        >
          <div className="text-white/40 text-[0.85vw] mb-3">payments/charge.ts</div>
          {codeLines.map((line, i) => {
            const flag = i === 2;
            return (
              <div key={i} className="flex gap-3">
                <span className="text-white/30 select-none w-6 text-right">{i + 1}</span>
                <pre className={flag && phase >= 3 ? 'text-red-300 bg-red-500/10 px-1 rounded' : 'text-emerald-200/90'}>{line}</pre>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          className="bg-[var(--color-bg-muted)] border border-white/10 rounded-xl p-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : 20 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[1vw] text-white/60 uppercase tracking-wider font-mono">live findings</span>
          </div>
          <div className="space-y-3">
            {findings.map((f, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 bg-white/5 border border-white/5 rounded-lg p-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: phase >= i + 3 ? 1 : 0, y: phase >= i + 3 ? 0 : 12 }}
              >
                <span
                  className="text-[0.8vw] font-mono px-2 py-1 rounded shrink-0"
                  style={{ background: `${f.color}25`, color: f.color }}
                >
                  {f.sev}
                </span>
                <span className="text-[1.05vw] text-white/90">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="absolute -bottom-8 -left-[4vw]"
          initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, scale: 1, rotate: 5 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <img src={imgCTO} className="w-[12vw] h-auto object-contain sketch-border sketch-shadow p-2 bg-white/10 rounded-full backdrop-blur-md" alt="CTO Watching" />
          <motion.div
            className="absolute -top-4 -right-4 bg-[#facc15] text-slate-900 font-bold text-lg px-3 py-1 rounded-full shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Caught it!
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
