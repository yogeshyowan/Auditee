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
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw] whiteboard-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-[1.5vw] uppercase tracking-[0.2em] font-display text-violet-500 mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}
      >
        Step 01 · Requirements Finder
      </motion.div>
      <motion.h2
        className="text-[3vw] font-bold font-display text-slate-800 mb-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
      >
        Conversation → BRS · PRD · FRD
      </motion.h2>

      <div className="w-[80vw] bg-white border-2 border-slate-800 rounded-2xl p-[2vw] sketch-shadow sketch-border">
        <div className="grid grid-cols-3 gap-4">
          {reqs.map((r, i) => (
            <motion.div
              key={r.id}
              className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 sketch-border"
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{
                opacity: phase >= i + 2 ? 1 : 0,
                y: phase >= i + 2 ? 0 : 24,
                scale: phase >= i + 2 ? 1 : 0.9,
              }}
              transition={{ type: 'spring', damping: 18 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[1.2vw] font-mono text-violet-600">{r.id}</span>
                <span className="text-[1vw] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-display">{r.kind}</span>
              </div>
              <div className="text-[1.4vw] font-body text-slate-800 leading-snug mb-2">{r.title}</div>
              <div className="text-[1vw] font-display text-slate-400">#{r.tag}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2 text-[1.2vw] font-display text-slate-500">
          <div className="w-3 h-3 rounded-full bg-emerald-400 border border-slate-800 animate-pulse" />
          AI generated · 6 of 24 requirements
        </div>
      </div>
    </motion.div>
  );
}
