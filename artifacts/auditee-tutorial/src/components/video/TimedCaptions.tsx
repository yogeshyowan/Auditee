import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type TimedCue = { startMs: number; endMs: number; text: string };

const HIGHLIGHTS: Record<string, string> = {
  'Auditee':      '#a78bfa',
  'Auditee.':     '#a78bfa',
  'AI-native':    '#38bdf8',
  'PCI':          '#fb923c',
  'DSS':          '#fb923c',
  'CAPA':         '#34d399',
  'UPI':          '#facc15',
  'BRS':          '#38bdf8',
  'PRD':          '#38bdf8',
  'FRD':          '#38bdf8',
  '50%':          '#f87171',
  'Acme':         '#c084fc',
  'Bank':         '#c084fc',
  'Auditee.site': '#a78bfa',
  'compliant':    '#34d399',
  'Continuously': '#34d399',
  'traceable':    '#38bdf8',
  'Audit-ready.': '#34d399',
  'IBM':          '#38bdf8',
  'DOORS':        '#38bdf8',
  'GitHub':       '#a78bfa',
  'ISO':          '#fb923c',
  '26262':        '#fb923c',
  'IEC':          '#fb923c',
  '62304':        '#fb923c',
  'HIPAA':        '#fb923c',
  'SOC':          '#fb923c',
  '2':            '#fb923c',
  'Jira':         '#38bdf8',
  'TestRail':     '#34d399',
};

const CHAR_RATE_PER_SEC = 38;

function TypewriterCue({ cue }: { cue: TimedCue }) {
  const [revealed, setRevealed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRevealed(0);
    const duration = cue.endMs - cue.startMs;
    const chars = cue.text.length;
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

  const words = cue.text.split(' ');
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
    const isStep = /^Step\s+\d+:?$/.test(word) || word === 'Step';

    if (colour) {
      elements.push(
        <span key={i} style={{ color: colour, textShadow: `0 0 18px ${colour}88`, fontWeight: 700 }}>
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
    charCount = wordEnd + 1;
  }

  return (
    <span>
      {elements}
      {revealed < cue.text.length && (
        <span style={{ animation: 'blink 0.7s step-end infinite', color: '#a78bfa' }}>|</span>
      )}
    </span>
  );
}

export function TimedCaptions({ cues, totalMs }: { cues: TimedCue[], totalMs: number }) {
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) % totalMs;
      let idx = -1;
      for (let i = 0; i < cues.length; i++) {
        if (elapsed >= cues[i].startMs && elapsed < cues[i].endMs) {
          idx = i;
          break;
        }
      }
      setActiveIdx(prev => (prev === idx ? prev : idx));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cues, totalMs]);

  const cue = activeIdx >= 0 ? cues[activeIdx] : null;

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
