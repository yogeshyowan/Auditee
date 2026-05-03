import { useEffect, useRef } from 'react';

/**
 * Upbeat lo-fi groove background music for the tutorial.
 *
 * Replaces the previous slow pad with something genuinely entertaining:
 *  - 4/4 kick + soft snare on the back-beat at ~92 BPM
 *  - Bouncy sub-bass that walks the chord roots
 *  - Bright marimba-like pluck arpeggio in C major (always consonant, never
 *    fights the voice-over)
 *  - Soft swelling pad for warmth
 *
 * Volume strategy:
 *  - Default master gain is modest (`gain` prop) so narration stays on top.
 *  - `auditee:narration:start` / `:end` window events duck/restore master.
 *  - Auto-starts on first user gesture (click/keydown/touchstart).
 *  - When `audioRef` is supplied, also follows that element's play/pause.
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

    let stepTimer: ReturnType<typeof setInterval> | null = null;
    let nodes: AudioNode[] = [];
    let ctx: AudioContext;

    // ----- Musical material ------------------------------------------------
    // C major key. 4-bar progression: C, Am, F, G (vi-IV-V flavour).
    const ROOTS = [65.41, 55.0, 43.65, 49.0]; // C2, A1, F1, G1
    // Pluck arpeggio (C major pentatonic, two octaves up): C5 D5 E5 G5 A5 G5 E5 D5
    const PLUCK = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
    // Pad chord voicings (root, third, fifth, seventh) - voiced higher
    const PAD: number[][] = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 392.0],  // G6/9-ish
    ];

    // 8 sixteenths per beat-pair = 16 steps per bar; we step every 16th note.
    // 92 BPM → 60/92 = 0.652s per beat → 0.163s per 16th. Round to 160ms.
    const STEP_MS = 160;
    const BEATS_PER_BAR = 16; // 16 sixteenths per bar
    let step = 0;
    let bar = 0;

    function build() {
      ctx = new AC();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      masterRef.current = master;

      // ----- Bus busses ----------------------------------------------------
      const drumBus = ctx.createGain();
      drumBus.gain.value = 0.55;
      drumBus.connect(master);

      const bassBus = ctx.createGain();
      bassBus.gain.value = 0.65;
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 320;
      bassFilter.Q.value = 0.7;
      bassBus.connect(bassFilter);
      bassFilter.connect(master);

      const pluckBus = ctx.createGain();
      pluckBus.gain.value = 0.42;
      const pluckFilter = ctx.createBiquadFilter();
      pluckFilter.type = 'lowpass';
      pluckFilter.frequency.value = 3500;
      pluckFilter.Q.value = 0.8;
      pluckBus.connect(pluckFilter);
      pluckFilter.connect(master);

      const padBus = ctx.createGain();
      padBus.gain.value = 0.20;
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 1200;
      padFilter.Q.value = 0.5;
      padBus.connect(padFilter);
      padFilter.connect(master);

      // ----- Persistent pad oscillators (4 voices, retuned per chord) ------
      const padVoices = PAD[0].map((freq) => {
        const g = ctx.createGain();
        g.gain.value = 0.18;
        g.connect(padBus);
        const o1 = ctx.createOscillator();
        o1.type = 'sawtooth';
        o1.frequency.value = freq;
        o1.detune.value = -6;
        const o2 = ctx.createOscillator();
        o2.type = 'triangle';
        o2.frequency.value = freq;
        o2.detune.value = 6;
        o1.connect(g);
        o2.connect(g);
        o1.start();
        o2.start();
        nodes.push(o1, o2, g);
        return { o1, o2 };
      });

      // ----- Helper voices -------------------------------------------------
      function kick(t: number) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g);
        g.connect(drumBus);
        o.start(t);
        o.stop(t + 0.22);
      }

      function snare(t: number) {
        // White-noise burst with a band-pass for that "tssch" quality
        const bufferSize = Math.floor(ctx.sampleRate * 0.18);
        const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1800;
        bp.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.45, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        src.connect(bp);
        bp.connect(g);
        g.connect(drumBus);
        src.start(t);
        src.stop(t + 0.18);
      }

      function hat(t: number, accent = false) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.06);
        const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(accent ? 0.18 : 0.10, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0005, t + (accent ? 0.08 : 0.045));
        src.connect(hp);
        hp.connect(g);
        g.connect(drumBus);
        src.start(t);
        src.stop(t + 0.08);
      }

      function bassNote(t: number, freq: number, durationSec: number) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t);
        // Tiny pitch slide adds bounce
        o.frequency.linearRampToValueAtTime(freq * 1.005, t + 0.04);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.55, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + durationSec);
        o.connect(g);
        g.connect(bassBus);
        o.start(t);
        o.stop(t + durationSec + 0.05);
      }

      function pluckNote(t: number, freq: number) {
        // Two-osc marimba-ish: sine fundamental + soft 2nd harmonic
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g = ctx.createGain();
        o1.type = 'sine';
        o2.type = 'triangle';
        o1.frequency.value = freq;
        o2.frequency.value = freq * 2;
        const g2 = ctx.createGain();
        g2.gain.value = 0.25;
        o2.connect(g2);
        g2.connect(g);
        o1.connect(g);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.45, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        g.connect(pluckBus);
        o1.start(t);
        o2.start(t);
        o1.stop(t + 0.5);
        o2.stop(t + 0.5);
      }

      function setChord(t: number, idx: number) {
        const target = PAD[idx];
        padVoices.forEach((v, i) => {
          v.o1.frequency.cancelScheduledValues(t);
          v.o2.frequency.cancelScheduledValues(t);
          v.o1.frequency.setValueAtTime(v.o1.frequency.value, t);
          v.o2.frequency.setValueAtTime(v.o2.frequency.value, t);
          v.o1.frequency.linearRampToValueAtTime(target[i], t + 0.4);
          v.o2.frequency.linearRampToValueAtTime(target[i], t + 0.4);
        });
      }

      // ----- Sequencer step ------------------------------------------------
      function tick() {
        const now = ctx.currentTime + 0.02;
        const sixteenth = step % 16;

        // New bar? Change chord (cycle through ROOTS / PAD).
        if (sixteenth === 0) {
          const chordIdx = bar % ROOTS.length;
          setChord(now, chordIdx);
          // Bass on beat 1 — long note
          bassNote(now, ROOTS[chordIdx], 0.45);
        }

        // Bass on beat 3 — same root, shorter
        if (sixteenth === 8) {
          const chordIdx = bar % ROOTS.length;
          bassNote(now, ROOTS[chordIdx], 0.30);
        }

        // Off-beat ghost bass on the "and" of 4 to push into the next bar
        if (sixteenth === 14) {
          const chordIdx = bar % ROOTS.length;
          bassNote(now, ROOTS[chordIdx] * 1.5, 0.18);
        }

        // Kick on beats 1 and 3 (16th = 0 and 8)
        if (sixteenth === 0 || sixteenth === 8) kick(now);
        // Soft kick on the "and" of 2 for groove
        if (sixteenth === 6) kick(now);

        // Snare on beats 2 and 4 (16th = 4 and 12) — classic back-beat
        if (sixteenth === 4 || sixteenth === 12) snare(now);

        // Hi-hat every 8th note, accent the down-beats
        if (sixteenth % 2 === 0) hat(now, sixteenth % 4 === 0);

        // Pluck arpeggio — one note per 8th-note (every 2 sixteenths)
        if (sixteenth % 2 === 0) {
          const pluckIdx = (sixteenth / 2) % PLUCK.length;
          pluckNote(now, PLUCK[pluckIdx]);
        }

        step++;
        if (sixteenth === 15) bar++;
      }

      stepTimer = setInterval(tick, STEP_MS);
    }

    function setMasterGain(value: number, durationSec = 0.6) {
      if (!masterRef.current || !ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
      masterRef.current.gain.linearRampToValueAtTime(value, now + durationSec);
    }

    function fadeIn() {
      setMasterGain(targetGainRef.current, 1.4);
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
      if (stepTimer) clearInterval(stepTimer);
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
      nodes.forEach((n) => {
        try { (n as OscillatorNode).stop?.(); } catch {/* */}
        try { n.disconnect(); } catch {/* */}
      });
      nodes = [];
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
