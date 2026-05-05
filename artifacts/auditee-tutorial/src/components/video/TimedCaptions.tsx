import { useEffect, useState, useRef, useCallback } from 'react';
import type { JSX } from 'react';
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
  'SmartInhaler': '#38bdf8',
  'Acme':         '#c084fc',
  'Health':       '#c084fc',
  'Priya':        '#facc15',
  'Marcus':       '#facc15',
  'Ananya':       '#facc15',
  'Connect':      '#38bdf8',
  '247':          '#38bdf8',
  '18':           '#fb923c',
  '87%':          '#34d399',
  '92%':          '#34d399',
  '94%':          '#34d399',
  'verified':     '#34d399',
  'compliant':    '#34d399',
  'traceable':    '#38bdf8',
  'IBM':          '#38bdf8',
  'DOORS':        '#38bdf8',
  'GitHub':       '#a78bfa',
  'Jira':         '#38bdf8',
  'ISO':          '#fb923c',
  '14971':        '#fb923c',
  '26262':        '#fb923c',
  'IEC':          '#fb923c',
  '62304':        '#fb923c',
  'HIPAA':        '#fb923c',
  'GDPR':         '#fb923c',
  'FDA':          '#fb923c',
  'QMSR':         '#fb923c',
  'DPDP':         '#fb923c',
  '510(k)':       '#facc15',
  'BLE':          '#38bdf8',
  'OTA':          '#38bdf8',
  'DHF':          '#facc15',
  'TestRail':     '#34d399',
  'Helios':       '#facc15',
  'Orion':        '#facc15',
  'Aesop':        '#facc15',
  'Apollo':       '#facc15',
  'Ares':         '#facc15',
  'Titan':        '#facc15',
  'Nexus':        '#facc15',
  'Vega':         '#facc15',
  'Sterling':     '#facc15',
  'Bastion':      '#facc15',
  'Atlas':        '#facc15',
  'Aegis':        '#facc15',
  'Cipher':       '#facc15',
  'Nova':         '#facc15',
  'ReqIF':        '#38bdf8',
  'HITRUST':      '#fb923c',
  'SOTIF':        '#fb923c',
  'MiFID':        '#fb923c',
  'CFTC':         '#fb923c',
  'PCI-DSS':      '#fb923c',
  'SOC':          '#fb923c',
  'BMS':          '#38bdf8',
  'ADAS':         '#38bdf8',
  'PLC':          '#38bdf8',
  'EHR':          '#38bdf8',
  'eCRF':         '#38bdf8',
  'VASP':         '#fb923c',
  'UPI':          '#38bdf8',
  'Riya':         '#facc15',
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

/**
 * Real HD voice via the api-server `/api/tutorial/tts` route (OpenAI tts-1-hd, voice=nova).
 * Pre-fetches every cue's audio on mount in parallel and caches blob URLs.
 * Falls back to browser SpeechSynthesis if the network call fails.
 */
function useHdVoiceNarration(cues: TimedCue[], activeIdx: number, muted: boolean, hasInteracted: boolean) {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<number, string>>(new Map());
  const inflightRef = useRef<Map<number, Promise<string | null>>>(new Map());
  const [, force] = useState(0);

  // Lazily create the <audio> element once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = new Audio();
    el.preload = 'auto';
    el.volume = 1.0;
    audioElRef.current = el;
    return () => {
      try { el.pause(); el.src = ''; } catch {/* */}
      audioElRef.current = null;
      cacheRef.current.forEach(url => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, []);

  const fetchCue = useCallback(async (idx: number): Promise<string | null> => {
    if (cacheRef.current.has(idx)) return cacheRef.current.get(idx)!;
    if (inflightRef.current.has(idx)) return inflightRef.current.get(idx)!;
    const cue = cues[idx];
    if (!cue) return null;

    const p = (async () => {
      try {
        const res = await fetch('/api/tutorial/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cue.text, voice: 'nova', speed: 1.07 }),
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        cacheRef.current.set(idx, url);
        force(n => n + 1);
        return url;
      } catch {
        return null;
      } finally {
        inflightRef.current.delete(idx);
      }
    })();
    inflightRef.current.set(idx, p);
    return p;
  }, [cues]);

  // Pre-fetch all cues once we know we'll be playing them
  useEffect(() => {
    if (!hasInteracted) return;
    cues.forEach((_, i) => { fetchCue(i); });
  }, [cues, fetchCue, hasInteracted]);

  // Play active cue
  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    try { el.pause(); } catch {/* */}
    if (muted || activeIdx < 0 || !hasInteracted) return;

    let cancelled = false;
    (async () => {
      const url = await fetchCue(activeIdx);
      if (cancelled) return;
      if (!url) {
        // Network/API failed — fall back to browser TTS so user still gets *something*
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const cue = cues[activeIdx];
          if (cue) {
            const utt = new SpeechSynthesisUtterance(cue.text);
            utt.rate = 1.05;
            utt.pitch = 1.05;
            utt.volume = 1.0;
            window.speechSynthesis.speak(utt);
          }
        }
        return;
      }
      el.src = url;
      el.currentTime = 0;
      el.volume = 1.0;
      // Notify the background music to duck while narration is playing.
      const onPlay = () => window.dispatchEvent(new Event('auditee:narration:start'));
      const onEndOrPause = () => window.dispatchEvent(new Event('auditee:narration:end'));
      el.addEventListener('playing', onPlay);
      el.addEventListener('pause', onEndOrPause);
      el.addEventListener('ended', onEndOrPause);
      el.play().catch(() => {/* gesture not granted yet */});
      return () => {
        el.removeEventListener('playing', onPlay);
        el.removeEventListener('pause', onEndOrPause);
        el.removeEventListener('ended', onEndOrPause);
      };
    })();

    return () => {
      cancelled = true;
      try { el.pause(); } catch {/* */}
      window.dispatchEvent(new Event('auditee:narration:end'));
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeIdx, muted, hasInteracted, cues, fetchCue]);
}

export function TimedCaptions({ cues, totalMs }: { cues: TimedCue[], totalMs: number }) {
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('tutorial_voice_muted') === '1'; } catch { return false; }
  });
  const startRef = useRef(Date.now());
  const [hasInteracted, setHasInteracted] = useState(false);

  useHdVoiceNarration(cues, activeIdx, muted, hasInteracted);

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
      try { localStorage.setItem('tutorial_voice_muted', next ? '1' : '0'); } catch {/* */}
      return next;
    });
  }, []);

  const cue = activeIdx >= 0 ? cues[activeIdx] : null;

  return (
    <>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

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
