import { useEffect, useRef } from 'react';

/**
 * Subtle cinematic ambient pad generated procedurally with the Web Audio API.
 * - Two detuned oscillators per voice, three voices in a minor-add9 chord
 * - Slow lowpass filter sweep + gentle stereo motion
 * - Volume kept low so narration stays prominent
 */
export function BackgroundMusic({ active = true }: { active?: boolean }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const stoppersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!active) return;

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // Fade in
    master.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 3);

    // Lowpass filter for warmth + slow movement
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.6;
    filter.connect(master);

    // Slow LFO on filter cutoff
    const filterLfo = ctx.createOscillator();
    filterLfo.frequency.value = 0.05;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 380;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    filterLfo.start();

    // Chord: A2, E3, C4, G4 — minor-add9 feel, calm tech
    const chord = [55, 82.4, 130.8, 196];

    const voices = chord.map((freq, i) => {
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = i === 0 ? 0.55 : 0.32;
      voiceGain.connect(filter);

      // Two detuned saws per voice
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sawtooth';
      o2.type = 'sawtooth';
      o1.frequency.value = freq;
      o2.frequency.value = freq;
      o1.detune.value = -8;
      o2.detune.value = 8;

      // Slow amplitude LFO (breathing)
      const ampLfo = ctx.createOscillator();
      ampLfo.frequency.value = 0.07 + i * 0.018;
      const ampLfoGain = ctx.createGain();
      ampLfoGain.gain.value = 0.12;
      ampLfo.connect(ampLfoGain);
      ampLfoGain.connect(voiceGain.gain);

      o1.connect(voiceGain);
      o2.connect(voiceGain);

      o1.start();
      o2.start();
      ampLfo.start();

      return { o1, o2, ampLfo, voiceGain };
    });

    // Soft pulse — heartbeat-like sub at 60 BPM
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0;
    pulseGain.connect(master);
    const pulse = ctx.createOscillator();
    pulse.type = 'sine';
    pulse.frequency.value = 41.2; // E1
    pulse.connect(pulseGain);
    pulse.start();

    const pulseInterval = setInterval(() => {
      const now = ctx.currentTime;
      pulseGain.gain.cancelScheduledValues(now);
      pulseGain.gain.setValueAtTime(0, now);
      pulseGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    }, 2000);

    stoppersRef.current = [
      () => clearInterval(pulseInterval),
      () => {
        try {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        } catch {/* */}
      },
      () => {
        setTimeout(() => {
          try { filterLfo.stop(); } catch {/* */}
          try { pulse.stop(); } catch {/* */}
          voices.forEach(v => {
            try { v.o1.stop(); } catch {/* */}
            try { v.o2.stop(); } catch {/* */}
            try { v.ampLfo.stop(); } catch {/* */}
          });
          try { ctx.close(); } catch {/* */}
        }, 500);
      },
    ];

    // Resume context on user gesture if it was blocked by autoplay policy
    const resume = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    resume();
    window.addEventListener('click', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });

    return () => {
      window.removeEventListener('click', resume);
      window.removeEventListener('keydown', resume);
      stoppersRef.current.forEach(s => s());
      stoppersRef.current = [];
      ctxRef.current = null;
    };
  }, [active]);

  return null;
}
