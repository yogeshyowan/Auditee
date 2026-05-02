import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const cols = [
  { name: 'Open', color: '#94A3B8', tickets: ['CAPA-205', 'CAPA-206'] },
  { name: 'In Progress', color: '#F59E0B', tickets: ['CAPA-202', 'CAPA-201'] },
  { name: 'In Review', color: '#3B82F6', tickets: ['CAPA-198'] },
  { name: 'Closed', color: '#10B981', tickets: ['CAPA-191', 'CAPA-185', 'CAPA-180'] },
];

export function CaseWorkflow() {
  const [phase, setPhase] = useState(0);
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setMoved(true), 4500),
      setTimeout(() => setPhase(3), 6500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}>
        Step 07 · Action Workflow
      </motion.div>
      <motion.h2 className="text-[2.6vw] font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}>
        Every CAPA tracked end-to-end
      </motion.h2>

      <div className="w-[80vw] grid grid-cols-4 gap-4">
        {cols.map((col, ci) => (
          <motion.div
            key={col.name}
            className="bg-[var(--color-bg-muted)] border border-white/10 rounded-xl p-4 min-h-[28vh]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
            transition={{ delay: ci * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[1vw] font-bold text-white/85">{col.name}</span>
              </div>
              <span className="text-[0.8vw] text-white/50 font-mono">{col.tickets.length}</span>
            </div>
            <div className="space-y-2">
              {col.tickets.map((t, ti) => {
                const movingTicket = t === 'CAPA-201' && col.name === 'In Progress' && moved;
                return (
                  <motion.div
                    key={t}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 text-[0.95vw]"
                    layout
                    animate={{
                      opacity: 1,
                      x: movingTicket ? '120%' : 0,
                      backgroundColor: movingTicket ? 'rgba(59,130,246,0.15)' : undefined,
                    }}
                    transition={{ duration: 0.8, type: 'spring', damping: 18, delay: ti * 0.05 }}
                  >
                    <div className="font-mono text-[var(--color-accent)] text-[0.85vw] mb-1">{t}</div>
                    <div className="text-white/75 text-[0.85vw] truncate">CAPA item</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-6 text-[1.05vw] text-white/60 italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
      >
        From conversation → to a compliant release. In days, not months.
      </motion.div>
    </motion.div>
  );
}
