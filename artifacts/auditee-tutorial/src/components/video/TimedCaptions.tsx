import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

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
        if (next >= chars && timerRef.current) clearInterval(timerRef.current);
        return Math.min(next, chars);
      });
    }, msPerChar);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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

/** Speak a cue via Web Speech API. Cancels any in-progress utterance first. */
function useVoiceNarration(cues: TimedCue[], activeIdx: number, muted: boolean) {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (muted || activeIdx < 0) return;
    const cue = cues[activeIdx];
    if (!cue) return;

    const utterance = new SpeechSynthesisUtterance(cue.text);
    utterance.rate = 0.88;
    utterance.pitch = 1.02;
    utterance.volume = 0.92;

    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis.getVoices();

    const preferred =
      voices.find(v => v.name === 'Google US English') ??
      voices.find(v => v.name === 'Samantha') ??
      voices.find(v => v.name === 'Karen') ??
      voices.find(v => v.name === 'Daniel') ??
      voices.find(v => v.name.startsWith('Microsoft') && v.lang.startsWith('en')) ??
      voices.find(v => v.lang.startsWith('en-') && !v.localService) ??
      voices.find(v => v.lang.startsWith('en-'));

    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
    return () => { window.speechSynthesis.cancel(); };
  }, [activeIdx, muted, cues]);
}

export function TimedCaptions({ cues, totalMs }: { cues: TimedCue[], totalMs: number }) {
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('tutorial_voice_muted') === '1'; } catch { return false; }
  });
  const startRef = useRef(Date.now());
  const [hasInteracted, setHasInteracted] = useState(false);

  useVoiceNarration(cues, hasInteracted ? activeIdx : -1, muted);

  useEffect(() => { startRef.current = Date.now(); }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) % totalMs;
      let idx = -1;
      for (let i = 0; i < cues.length; i++) {
        if (elapsed >= cues[i].startMs && elapsed < cues[i].endMs) { idx = i; break; }
      }
      setActiveIdx(prev => (prev === idx ? prev : idx));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cues, totalMs]);

  // First user interaction unlocks voice (browser autoplay policy)
  useEffect(() => {
    const unlock = () => setHasInteracted(true);
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      try { localStorage.setItem('tutorial_voice_muted', next ? '1' : '0'); } catch {}
      if (next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  const cue = activeIdx >= 0 ? cues[activeIdx] : null;

  return (
    <>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* Mute / unmute button — top-right corner */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute voice narration' : 'Mute voice narration'}
        className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all"
        style={{
          background: 'rgba(15,12,40,0.70)',
          border: '1px solid rgba(167,139,250,0.25)',
          backdropFilter: 'blur(10px)',
          color: muted ? 'rgba(255,255,255,0.35)' : 'rgba(167,139,250,0.9)',
        }}
      >
        {muted
          ? <VolumeX className="w-3.5 h-3.5" />
          : <Volume2 className="w-3.5 h-3.5" />
        }
        <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          {muted ? 'Voice off' : 'Voice on'}
        </span>
      </button>

      {/* Caption box — bottom center */}
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
              {!hasInteracted && (
                <p className="text-center text-xs text-white/40 mb-2" style={{ fontSize: '0.7rem' }}>
                  Click anywhere to enable voice narration
                </p>
              )}
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
