import { useEffect, useState, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Cue = { start: number; end: number; text: string };

// Times in seconds, aligned to public/audio/narration.mp3 (~107s).
const CUES: Cue[] = [
  { start: 0.0, end: 3.5, text: 'Enterprise software is broken.' },
  { start: 3.5, end: 9.0, text: 'Teams waste up to 50% of their time hunting for context.' },
  { start: 9.0, end: 11.0, text: 'Audits become nightmares.' },
  { start: 11.0, end: 14.0, text: 'Releases slip. Legacy code keeps modernization paralyzed.' },

  { start: 14.0, end: 17.0, text: 'Meet Auditee.' },
  { start: 17.0, end: 22.0, text: 'The AI-native control plane for the product development lifecycle.' },
  { start: 22.0, end: 25.0, text: 'From idea, to code, to compliant audit — in one knowledge graph.' },

  { start: 25.0, end: 31.0, text: 'Case study: Acme Bank — UPI mobile payments, regulated under PCI DSS.' },

  { start: 31.0, end: 34.0, text: 'Step one: Requirements Finder.' },
  { start: 34.0, end: 40.5, text: 'Smart Interview turns a conversation into structured BRS and PRD requirements.' },

  { start: 40.5, end: 43.0, text: 'Step two: Traceability matrix.' },
  { start: 43.0, end: 49.5, text: 'Every requirement linked to code, tests, and PCI DSS controls.' },

  { start: 49.5, end: 52.0, text: 'Step three: Compliance audit.' },
  { start: 52.0, end: 59.0, text: 'AI auditors scan the codebase continuously. Findings appear in real time.' },

  { start: 59.0, end: 61.0, text: 'Step four: Audit report.' },
  { start: 61.0, end: 68.5, text: 'Cover, executive summary, controls coverage, findings — ready for auditors.' },

  { start: 68.5, end: 71.0, text: 'Step five: Missing requirements.' },
  { start: 71.0, end: 76.0, text: 'Acme spots three critical gaps before release.' },

  { start: 76.0, end: 78.5, text: 'Step six: CAPA generation.' },
  { start: 78.5, end: 84.5, text: 'Corrective and Preventive Actions auto-drafted with owners and due dates.' },

  { start: 84.5, end: 87.0, text: 'Step seven: Action workflow.' },
  { start: 87.0, end: 93.0, text: 'CAPA tickets flow through Open, In Progress, In Review, Closed.' },

  { start: 93.0, end: 99.0, text: 'From conversation, to a compliant release — in days, not months.' },

  { start: 99.0, end: 106.0, text: 'Audit-ready. Fully traceable. Continuously compliant.' },

  { start: 106.0, end: 112.0, text: 'Auditee.site — ship enterprise software with total clarity.' },
];

export function Captions({ audioRef }: { audioRef: RefObject<HTMLAudioElement | null> }) {
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      const t = a && !a.paused ? a.currentTime : 0;
      let idx = -1;
      for (let i = 0; i < CUES.length; i++) {
        if (t >= CUES[i].start && t < CUES[i].end) {
          idx = i;
          break;
        }
      }
      setActiveIdx(prev => (prev === idx ? prev : idx));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioRef]);

  const cue = activeIdx >= 0 ? CUES[activeIdx] : null;

  return (
    <div className="absolute inset-x-0 bottom-[6vh] flex justify-center pointer-events-none z-20">
      <AnimatePresence mode="wait">
        {cue && (
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="max-w-[80vw] px-6 py-3 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 shadow-2xl"
          >
            <div className="text-center text-[1.5vw] leading-snug font-medium text-white tracking-wide">
              {cue.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
