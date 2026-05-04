import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function CaseReport() {
  const [page, setPage] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPage(1), 800),
      setTimeout(() => setPage(2), 3300),
      setTimeout(() => setPage(3), 5800),
      setTimeout(() => setPage(3), 8300),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  
  const imgCompliance = `${import.meta.env.BASE_URL}images/compliance_frantic.png`;

  const pages = [
    {
      header: 'COVER',
      title: 'PCI DSS 4.0 Audit Report',
      sub: 'Acme Bank · UPI Payments · Q2 2026',
      body: (
        <div className="mt-8 space-y-2 text-[1vw] text-white/60">
          <div>Prepared by: Auditee AI</div>
          <div>Audit window: 90 days continuous</div>
          <div>Reviewed by: J. Mehta, Head of Security</div>
        </div>
      ),
    },
    {
      header: 'EXECUTIVE SUMMARY',
      title: 'Compliance posture: 94%',
      sub: 'Score trending up · 3 open findings',
      body: (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { l: 'Controls passed', v: '342', c: '#10B981' },
            { l: 'Open findings', v: '3', c: '#F59E0B' },
            { l: 'Critical gaps', v: '1', c: '#EF4444' },
          ].map((s) => (
            <div key={s.l} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-[2vw] font-bold" style={{ color: s.c }}>{s.v}</div>
              <div className="text-[0.85vw] text-white/60 uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'CONTROLS COVERAGE',
      title: 'PCI DSS · 12 requirements',
      sub: 'By domain',
      body: (
        <div className="mt-6 space-y-2">
          {[
            { l: 'Build & Maintain Network Security', v: 96 },
            { l: 'Protect Cardholder Data', v: 91 },
            { l: 'Vulnerability Management', v: 98 },
            { l: 'Strong Access Control', v: 95 },
            { l: 'Monitor & Test Networks', v: 89 },
            { l: 'Information Security Policy', v: 100 },
          ].map((b) => (
            <div key={b.l} className="text-[0.9vw]">
              <div className="flex justify-between mb-1">
                <span className="text-white/80">{b.l}</span>
                <span className="text-white/60 font-mono">{b.v}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-alt)]" style={{ width: `${b.v}%` }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'FINDINGS LIST',
      title: '3 open · ranked by severity',
      sub: 'All routed to CAPA workflow',
      body: (
        <div className="mt-4 space-y-2 text-[0.95vw]">
          {[
            { id: 'F-101', s: 'HIGH', c: '#EF4444', t: 'PAN cleartext logging in payments/charge.ts' },
            { id: 'F-102', s: 'MED', c: '#F59E0B', t: 'Missing idempotency key on charge endpoint' },
            { id: 'F-103', s: 'LOW', c: '#94A3B8', t: 'No retry/backoff on gateway timeout' },
          ].map((f) => (
            <div key={f.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-md p-2.5">
              <span className="font-mono text-white/60 text-[0.85vw] w-12">{f.id}</span>
              <span className="text-[0.75vw] font-mono px-2 py-0.5 rounded shrink-0" style={{ background: `${f.c}25`, color: f.c }}>{f.s}</span>
              <span className="text-white/90">{f.t}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Step 04 · AI-generated audit report
      </motion.div>
      <motion.h2 className="text-[2.6vw] font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        Auditor-ready PDF, on demand
      </motion.h2>

      <div className="relative w-[58vw] h-[44vh]">
        {pages.map((p, i) => {
          const offset = i - page;
          const isActive = i === page;
          return (
            <motion.div
              key={i}
              className="absolute inset-0 bg-gradient-to-br from-[#1a1630] to-[#0f0a1a] text-white rounded-xl p-[2.5vw] shadow-2xl border border-white/15"
              animate={{
                opacity: Math.abs(offset) > 1 ? 0 : (isActive ? 1 : 0.3),
                x: offset * 30,
                y: offset * 16,
                scale: isActive ? 1 : 0.93,
                rotate: offset * 1.5,
                zIndex: 10 - Math.abs(offset),
              }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="text-[0.85vw] font-mono uppercase tracking-[0.3em] text-indigo-400 mb-2">{p.header}</div>
              <div className="text-[2vw] font-bold text-white/95 leading-tight">{p.title}</div>
              <div className="text-[1vw] text-white/50 mt-1">{p.sub}</div>
              {p.body}
              <div className="absolute bottom-3 right-4 text-[0.7vw] text-white/40 font-mono">Auditee · {i + 1}/{pages.length}</div>
            </motion.div>
          );
        })}
      </div>
      
      <motion.div
        className="absolute bottom-[5vh] right-[10vw]"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: page >= 1 ? 1 : 0, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <img src={imgCompliance} className="w-48 h-48 object-contain sketch-border sketch-shadow p-2 rounded-full backdrop-blur-md" alt="Compliance Relieved" />
        <motion.div
          className="absolute -top-4 -right-4 bg-emerald-500 text-white font-bold text-xl px-4 py-2 rounded-full shadow-lg"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Relieved!
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
