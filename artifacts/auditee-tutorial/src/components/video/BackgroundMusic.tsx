import { useEffect, useRef } from 'react';

/**
 * Pleasant, slowly-evolving pad with a gentle I-vi-IV-V chord progression
 * (D - Bm - G - A) and a soft melody arpeggio on top. Designed to sit
 * cleanly under voice-over.
 *
 * Volume strategy:
 *  - Default master gain is modest (0.085) so narration is always intelligible.
 *  - When narration is playing (signaled by the global window events
 *    `auditee:narration:start` / `auditee:narration:end`), the master ducks
 *    further to ~40% so the voice is crystal-clear.
 *
 * Defaults to autostart on first user gesture (no audioRef needed) so the
 * music plays even when modules don't have their own narration audio
 * element to attach to. When an audioRef IS supplied, it follows that
 * element's play/pause/ended events as well.
 */
export function BackgroundMusic({
  active = true,
  audioRef,
  gain = 0.085,
}: {
  active?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  gain?: number;
}) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);
  const targetGainRef = useRef<number>(gain);

  useEffect(() => {
    if (!active) return;

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;

    let ctx: AudioContext;
    let voices: Array<{ o1: OscillatorNode; o2: OscillatorNode; gain: GainNode }> = [];
    let melody: OscillatorNode | null = null;
    let melodyGain: GainNode | null = null;
    let filterLfo: OscillatorNode | null = null;
    let chordTimer: ReturnType<typeof setInterval> | null = null;
    let melodyTimer: ReturnType<typeof setInterval> | null = null;

    // I-vi-IV-V in D major: D, Bm, G, A
    // Each chord = root, third, fifth, ninth (sweet, open voicing)
    const CHORDS: number[][] = [
      [73.42, 110.0, 146.83, 220.0, 277.18], // D2 A2 D3 A3 C#4
      [61.74, 92.50, 123.47, 185.0, 246.94], // B1 F#2 B2 F#3 B3
      [49.00, 73.42, 98.00, 146.83, 196.0],  // G1 D2 G2 D3 G3
      [55.00, 82.41, 110.0, 164.81, 220.0],  // A1 E2 A2 E3 A3
    ];

    // Pentatonic melody notes (D major pent: D E F# A B) one octave up — gentle, never dissonant
    const MELODY_NOTES = [587.33, 659.25, 739.99, 880.0, 987.77, 880.0, 739.99, 659.25];
    let melodyIdx = 0;

    function build() {
      ctx = new AC();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      masterRef.current = master;

      // Soft lowpass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      filter.Q.value = 0.6;
      filter.connect(master);

      // Slow filter LFO — gentle "breathing"
      filterLfo = ctx.createOscillator();
      filterLfo.frequency.value = 0.05;
      const flGain = ctx.createGain();
      flGain.gain.value = 350;
      filterLfo.connect(flGain);
      flGain.connect(filter.frequency);
      filterLfo.start();

      // Build 5 voice slots — frequencies will be re-tuned each chord change
      const initial = CHORDS[0];
      voices = initial.map((freq, i) => {
        const vGain = ctx.createGain();
        vGain.gain.value = i === 0 ? 0.32 : 0.20;
        vGain.connect(filter);

        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        o1.type = i === 0 ? 'triangle' : 'sawtooth';
        o2.type = 'triangle';
        o1.frequency.value = freq;
        o2.frequency.value = freq;
        o1.detune.value = -7;
        o2.detune.value = 7;
        o1.connect(vGain);
        o2.connect(vGain);
        o1.start();
        o2.start();

        return { o1, o2, gain: vGain };
      });

      // Melody arpeggio — sine wave with quick envelope per note
      melodyGain = ctx.createGain();
      melodyGain.gain.value = 0;
      melodyGain.connect(filter);

      melody = ctx.createOscillator();
      melody.type = 'sine';
      melody.frequency.value = MELODY_NOTES[0];
      melody.connect(melodyGain);
      melody.start();

      // Chord progression — change every ~6s, smoothly glide
      let chordIdx = 0;
      const advanceChord = () => {
        chordIdx = (chordIdx + 1) % CHORDS.length;
        const next = CHORDS[chordIdx];
        const t = ctx.currentTime;
        voices.forEach((v, i) => {
          const target = next[i];
          v.o1.frequency.cancelScheduledValues(t);
          v.o2.frequency.cancelScheduledValues(t);
          v.o1.frequency.setValueAtTime(v.o1.frequency.value, t);
          v.o2.frequency.setValueAtTime(v.o2.frequency.value, t);
          v.o1.frequency.linearRampToValueAtTime(target, t + 1.8);
          v.o2.frequency.linearRampToValueAtTime(target, t + 1.8);
        });
      };
      chordTimer = setInterval(advanceChord, 6000);

      // Melody — pluck a note every ~750 ms with a quick attack/decay envelope
      const pluckNote = () => {
        if (!melody || !melodyGain) return;
        melodyIdx = (melodyIdx + 1) % MELODY_NOTES.length;
        const t = ctx.currentTime;
        melody.frequency.setValueAtTime(MELODY_NOTES[melodyIdx], t);
        melodyGain.gain.cancelScheduledValues(t);
        melodyGain.gain.setValueAtTime(0, t);
        melodyGain.gain.linearRampToValueAtTime(0.045, t + 0.04);
        melodyGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.65);
      };
      melodyTimer = setInterval(pluckNote, 750);
    }

    function setMasterGain(value: number, durationSec = 0.6) {
      if (!masterRef.current || !ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
      masterRef.current.gain.linearRampToValueAtTime(value, now + durationSec);
    }

    function fadeIn() {
      setMasterGain(targetGainRef.current, 2.0);
    }

    function fadeOut() {
      setMasterGain(0, 0.7);
    }

    function startAudio() {
      if (startedRef.current) {
        ctxRef.current?.resume().then(fadeIn).catch(() => {});
        return;
      }
      startedRef.current = true;
      build();
      ctxRef.current?.resume().then(fadeIn).catch(() => {});
    }

    function pauseAudio() {
      fadeOut();
      setTimeout(() => {
        ctxRef.current?.suspend().catch(() => {});
      }, 800);
    }

    // --- Volume ducking on narration -------------------------------------
    const onNarrationStart = () => {
      targetGainRef.current = gain * 0.40;
      if (startedRef.current) setMasterGain(targetGainRef.current, 0.35);
    };
    const onNarrationEnd = () => {
      targetGainRef.current = gain;
      if (startedRef.current) setMasterGain(targetGainRef.current, 0.6);
    };
    window.addEventListener('auditee:narration:start', onNarrationStart);
    window.addEventListener('auditee:narration:end', onNarrationEnd);

    const el = audioRef?.current;
    if (el) {
      el.addEventListener('play', startAudio);
      el.addEventListener('pause', pauseAudio);
      el.addEventListener('ended', pauseAudio);
      if (!el.paused) startAudio();
    }

    // Auto-start on first user gesture (works even when no audioRef supplied)
    const gesture = () => { startAudio(); };
    window.addEventListener('click', gesture, { once: true });
    window.addEventListener('keydown', gesture, { once: true });
    window.addEventListener('touchstart', gesture, { once: true });

    return () => {
      if (chordTimer) clearInterval(chordTimer);
      if (melodyTimer) clearInterval(melodyTimer);
      window.removeEventListener('auditee:narration:start', onNarrationStart);
      window.removeEventListener('auditee:narration:end', onNarrationEnd);
      if (el) {
        el.removeEventListener('play', startAudio);
        el.removeEventListener('pause', pauseAudio);
        el.removeEventListener('ended', pauseAudio);
      }
      window.removeEventListener('click', gesture);
      window.removeEventListener('keydown', gesture);
      window.removeEventListener('touchstart', gesture);
      try { filterLfo?.stop(); } catch {/* */}
      try { melody?.stop(); } catch {/* */}
      voices.forEach(v => {
        try { v.o1.stop(); } catch {/* */}
        try { v.o2.stop(); } catch {/* */}
      });
      setTimeout(() => {
        try { ctxRef.current?.close(); } catch {/* */}
        ctxRef.current = null;
        masterRef.current = null;
        startedRef.current = false;
      }, 1000);
    };
  }, [active, audioRef, gain]);

  return null;
}
