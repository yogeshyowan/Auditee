import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3000), // Ideation
      setTimeout(() => setPhase(3), 6000), // Design
      setTimeout(() => setPhase(4), 9000), // Dev
      setTimeout(() => setPhase(5), 12000), // Test
      setTimeout(() => setPhase(6), 15000), // Launch
      setTimeout(() => setPhase(7), 18000), // Governance
      setTimeout(() => setPhase(8), 22000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const stages = [
    { name: "Ideation", detail: "Smart Interviews extract requirements" },
    { name: "Design", detail: "Auto-generates BRDs, PRDs, FRDs" },
    { name: "Development", detail: "Bidirectional traceability: reqs ↔ code" },
    { name: "Testing", detail: "Auto-generated test cases" },
    { name: "Launch", detail: "Deployment success & adoption tracking" },
    { name: "Governance", detail: "Continuous compliance scoring" },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex p-[5vw]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-[30%] h-full flex flex-col justify-center border-r border-white/20 pr-[3vw]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -20 }}
        >
          <div className="text-[1.2vw] text-[var(--color-text-muted)] font-mono mb-2 uppercase tracking-widest">Case Study</div>
          <h2 className="text-[3vw] font-bold leading-tight mb-4">Acme Bank</h2>
          <p className="text-[1.5vw] text-[var(--color-text-secondary)]">Building a new mobile payments feature.</p>
        </motion.div>
      </div>

      <div className="w-[70%] pl-[4vw] flex flex-col justify-center gap-6">
        {stages.map((stage, i) => {
          const isActive = phase >= i + 2;
          return (
            <motion.div 
              key={i}
              className="flex items-center gap-6 relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ 
                opacity: isActive ? 1 : 0.2, 
                x: isActive ? 0 : 40,
                scale: phase === i + 2 ? 1.05 : 1
              }}
              transition={{ duration: 0.5 }}
            >
              <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-[var(--color-accent)] shadow-[0_0_15px_var(--color-accent)]' : 'bg-white/20'}`} />
              <div>
                <div className={`text-[2vw] font-bold ${isActive ? 'text-white' : 'text-white/40'}`}>{stage.name}</div>
                <div className={`text-[1.3vw] ${isActive ? 'text-[var(--color-accent-alt)]' : 'text-white/20'}`}>{stage.detail}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
