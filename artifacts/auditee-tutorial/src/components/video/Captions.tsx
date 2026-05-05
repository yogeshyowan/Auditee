import { useEffect, useState, useRef, RefObject } from 'react';
import type { JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Cue = { start: number; end: number; text: string };

// Times in seconds, aligned to public/audio/narration.mp3 (~107s).
const CUES: Cue[] = [
  { start: 0.0,  end: 3.5,  text: 'Enterprise software is broken.' },
  { start: 3.5,  end: 9.0,  text: 'Teams waste up to 50% of their time hunting for context.' },
  { start: 9.0,  end: 11.0, text: 'Audits become nightmares.' },
  { start: 11.0, end: 14.0, text: 'Releases slip. Legacy code keeps modernization paralyzed.' },

  { start: 14.0, end: 17.0, text: 'Meet Auditee.' },
  { start: 17.0, end: 22.0, text: 'The AI-native control plane for the product development lifecycle.' },
  { start: 22.0, end: 25.0, text: 'From idea, to code, to compliant audit — in one knowledge graph.' },

  { start: 25.0, end: 31.0, text: 'Case study: Acme Bank — UPI mobile payments, regulated under PCI DSS.' },

  { start: 31.0, end: 34.0, text: 'Step 1: Requirements Finder.' },
  { start: 34.0, end: 40.5, text: 'Smart Interview turns a conversation into structured BRS and PRD requirements.' },

  { start: 40.5, end: 43.0, text: 'Step 2: Traceability matrix.' },
  { start: 43.0, end: 49.5, text: 'Every requirement linked to code, tests, and PCI DSS controls.' },

  { start: 49.5, end: 52.0, text: 'Step 3: Compliance audit.' },
  { start: 52.0, end: 59.0, text: 'AI auditors scan the codebase continuously. Findings appear in real time.' },

  { start: 59.0, end: 61.0, text: 'Step 4: Audit report.' },
  { start: 61.0, end: 68.5, text: 'Cover, executive summary, controls coverage, findings — ready for auditors.' },

  { start: 68.5, end: 71.0, text: 'Step 5: Missing requirements.' },
  { start: 71.0, end: 76.0, text: 'Acme spots three critical gaps before release.' },

  { start: 76.0, end: 78.5, text: 'Step 6: CAPA generation.' },
  { start: 78.5, end: 84.5, text: 'Corrective and Preventive Actions auto-drafted with owners and due dates.' },

  { start: 84.5, end: 87.0, text: 'Step 7: Action workflow.' },
  { start: 87.0, end: 93.0, text: 'CAPA tickets flow through Open → In Progress → In Review → Closed.' },

  { start: 93.0, end: 98.0, text: 'And when you\'re ready to scale, Auditee scales with you.' },
  { start: 98.0, end: 102.0, text: 'Frictionless subscription upgrades right from the app.' },

  { start: 102.0, end: 106.0, text: 'From conversation, to a compliant release — in days, not months.' },
  { start: 106.0, end: 111.0, text: 'Auditee.site — ship enterprise software with total clarity.' },
];

// Words that get a colour highlight
const HIGHLIGHTS: Record<string, string> = {
  'Auditee':      '#a78bfa',   // violet
  'Auditee.':     '#a78bfa',
  'AI-native':    '#38bdf8',   // sky
  'PCI':          '#fb923c',   // orange
  'DSS':          '#fb923c',
  'CAPA':         '#34d399',   // emerald
  'UPI':          '#facc15',   // yellow
  'BRS':          '#38bdf8',
  'PRD':          '#38bdf8',
  '50%':          '#f87171',   // red
  'Acme':         '#c084fc',
  'Bank':         '#c084fc',
  'Auditee.site': '#a78bfa',
  'compliant':    '#34d399',
  'Continuously': '#34d399',
  'traceable':    '#38bdf8',
  'Audit-ready.': '#34d399',
};

function HighlightedWord({ word, idx }: { word: string; idx: number }) {
  const clean = word.replace(/[.,—→]/g, '');
  const colour = HIGHLIGHTS[word] ?? HIGHLIGHTS[clean];
  if (colour) {
    return (
      <span
        style={{
          color: colour,
          textShadow: `0 0 18px ${colour}88`,
          fontWeight: 700,
        }}
      >
        {word}{' '}
      </span>
    );
  }
  // Accent every "Step N:" token
  if (/^Step\s+\d+:?$/.test(word) || word === 'Step') {
    return (
      <span style={{ color: '#818cf8', fontWeight: 700 }}>
        {word}{' '}
      </span>
    );
  }
  return <span key={idx}>{word} </span>;
}

const CHAR_RATE_PER_SEC = 38; // characters per second for typewriter speed

function TypewriterCue({ cue }: { cue: Cue }) {
  const [revealed, setRevealed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRevealed(0);
    const duration = (cue.end - cue.start) * 1000;
    const chars = cue.text.length;
    // finish within 80% of the cue window so full text stays visible
    const msPerChar = Math.min((duration * 0.8) / chars, 1000 / CHAR_RATE_PER_SEC);

    timerRef.current = setInterval(() => {
      setRevealed(prev => {
        const next = prev + 1;
        if (next >= chars) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return Math.min(next, chars);
      });
    }, msPerChar);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cue]);

  const visibleText = cue.text.slice(0, revealed);
  const words = cue.text.split(' ');

  // Re-build word spans up to visible character count
  let charCount = 0;
  const elements: JSX.Element[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordEnd = charCount + word.length;
    if (charCount >= revealed) break;
    const slice = cue.text.slice(charCount, Math.min(wordEnd, revealed));
    const suffix = revealed > wordEnd ? ' ' : '';
    const clean = word.replace(/[.,—→]/g, '');
    const colour = HIGHLIGHTS[word] ?? HIGHLIGHTS[clean];
    const isStep = /^Step$/.test(word);

    if (colour) {
      elements.push(
        <span
          key={i}
          style={{
            color: colour,
            textShadow: `0 0 18px ${colour}88`,
            fontWeight: 700,
          }}
        >
          {slice}{suffix}
        </span>
      );
    } else if (isStep) {
      elements.push(
        <span key={i} style={{ color: '#818cf8', fontWeight: 700 }}>
          {slice}{suffix}
        </span>
      );
    } else {
      elements.push(<span key={i}>{slice}{suffix}</span>);
    }

    charCount = wordEnd + 1; // +1 for space
  }

  return (
    <span>
      {elements}
      {/* blinking cursor while typing */}
      {revealed < cue.text.length && (
        <span
          style={{ animation: 'blink 0.7s step-end infinite', color: '#a78bfa' }}
        >
          |
        </span>
      )}
    </span>
  );
}

export function Captions({ audioRef }: { audioRef: RefObject<HTMLAudioElement | null> }) {
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      const t = a ? a.currentTime : 0;
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
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
      <div className="absolute inset-x-0 bottom-[5vh] flex justify-center pointer-events-none z-20 px-6">
        <AnimatePresence mode="wait">
          {cue && (
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="max-w-[82vw] px-7 py-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(15,12,40,0.82) 0%, rgba(20,20,50,0.88) 100%)',
                border: '1px solid rgba(167,139,250,0.25)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.08)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <p
                className="text-center leading-snug tracking-wide"
                style={{
                  fontSize: 'clamp(14px, 1.6vw, 24px)',
                  color: '#e2e8f0',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}
              >
                <TypewriterCue cue={cue} />
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
