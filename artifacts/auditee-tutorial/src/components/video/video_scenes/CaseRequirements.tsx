import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const reqs = [
  { id: 'BRS-001', kind: 'BRS', title: 'Customers can send INR via UPI', tag: 'Functional' },
  { id: 'BRS-002', kind: 'BRS', title: 'Two-factor auth on every transfer > ₹5,000', tag: 'Security' },
  { id: 'PRD-014', kind: 'PRD', title: 'Real-time fraud risk scoring', tag: 'Risk' },
  { id: 'PRD-022', kind: 'PRD', title: 'Cardholder data tokenization at rest', tag: 'PCI DSS' },
  { id: 'FRD-031', kind: 'FRD', title: 'Encrypted audit log for every payment event', tag: 'Compliance' },
  { id: 'FRD-047', kind: 'FRD', title: 'Daily reconciliation report to NPCI', tag: 'Operations' },
];

export function CaseRequirements() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      ...reqs.map((_, i) => setTimeout(() => setPhase(2 + i), 600 + i * 1200)),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
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
        Step 01 · Requirements Finder
      </motion.div>
      <motion.h2
        className="text-[3vw] font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
      >
        Conversation → BRS · PRD · FRD
      </motion.h2>

      <div className="w-[80vw] bg-[var(--color-bg-muted)] border border-white/10 rounded-2xl p-[2vw]">
        <div className="grid grid-cols-3 gap-4">
          {reqs.map((r, i) => (
            <motion.div
              key={r.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{
                opacity: phase >= i + 2 ? 1 : 0,
                y: phase >= i + 2 ? 0 : 24,
                scale: phase >= i + 2 ? 1 : 0.9,
              }}
              transition={{ type: 'spring', damping: 18 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.9vw] font-mono text-[var(--color-accent)]">{r.id}</span>
                <span className="text-[0.75vw] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-accent-alt)]/20 text-[var(--color-accent-alt)]">{r.kind}</span>
              </div>
              <div className="text-[1.05vw] text-white/90 leading-snug mb-2">{r.title}</div>
              <div className="text-[0.8vw] text-white/40">#{r.tag}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2 text-[0.95vw] text-white/60">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AI generated · 6 of 24 requirements
        </div>
      </div>
    </motion.div>
  );
}
