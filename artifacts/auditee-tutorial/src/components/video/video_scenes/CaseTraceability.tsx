import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const rows = [
  { req: 'PRD-022', code: 'tokenizer.ts', test: 'TC-014', ctrl: 'PCI 3.4.1' },
  { req: 'BRS-002', code: 'auth/mfa.ts', test: 'TC-007', ctrl: 'PCI 8.3.1' },
  { req: 'FRD-031', code: 'audit/log.ts', test: 'TC-022', ctrl: 'PCI 10.2.1' },
  { req: 'PRD-014', code: 'fraud/score.ts', test: 'TC-031', ctrl: 'PCI 5.2.1' },
  { req: 'FRD-047', code: 'recon/daily.ts', test: 'TC-040', ctrl: 'PCI 10.4.1' },
];

export function CaseTraceability() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      ...rows.map((_, i) => setTimeout(() => setPhase(2 + i), 800 + i * 900)),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      style={{ background: 'radial-gradient(circle at 50% 40%, rgba(56,189,248,0.06) 0%, var(--color-bg-dark) 70%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-[1.5vw] font-display uppercase tracking-[0.2em] text-violet-400 mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}
      >
        Step 02 · Traceability Matrix
      </motion.div>
      <motion.h2
        className="text-[2.8vw] font-bold font-display text-white/90 mb-6 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
      >
        Requirement <span className="text-sky-400">↔</span> Code <span className="text-sky-400">↔</span> Test <span className="text-sky-400">↔</span> PCI DSS 4.0
      </motion.h2>

      <div className="w-[78vw] bg-[var(--color-bg-muted)] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-4 px-6 py-3 text-[1.2vw] font-display text-white/50 uppercase tracking-wider border-b border-white/10 bg-white/5">
          <div>Requirement</div>
          <div>Code module</div>
          <div>Test case</div>
          <div>PCI DSS control</div>
        </div>
        {rows.map((r, i) => (
          <motion.div
            key={r.req}
            className="grid grid-cols-4 px-6 py-4 text-[1.4vw] font-body text-white/80 border-b border-white/8 items-center"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: phase >= i + 2 ? 1 : 0, x: phase >= i + 2 ? 0 : -30 }}
            transition={{ duration: 0.5 }}
          >
            <div className="font-mono text-violet-400">{r.req}</div>
            <div className="font-mono text-white/60 text-[1.2vw]">{r.code}</div>
            <div className="font-mono text-white/60 text-[1.2vw]">{r.test}</div>
            <div>
              <span className="px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-300 text-[1.2vw] font-mono border border-emerald-400/30">{r.ctrl}</span>
            </div>
          </motion.div>
        ))}
        <div className="px-6 py-3 flex justify-between text-[1.2vw] font-display text-white/50">
          <span>Coverage <span className="text-emerald-400 font-bold">94%</span></span>
          <span>Standard: <span className="text-white/80">PCI DSS 4.0</span></span>
        </div>
      </div>
    </motion.div>
  );
}
