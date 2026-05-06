import { useEffect, useRef } from 'react';

/**
 * Inspiring cinematic background score.
 *
 * D major. Slow, hopeful, builds gently — designed to feel like the
 * opening of a SaaS launch trailer or a TED-style intro:
 *   - Warm sustained pad (sine + triangle blend) sweeping I-vi-IV-V
 *   - Soft piano-like FM bell arpeggio gently sparkling on top
 *   - Optional sub-bass pulse on chord roots for body
 *   - Slow tempo (~68 BPM) with two-bar chord changes
 *
 * Volume strategy:
 *   - Auto-starts on first user gesture (click/keydown/touchstart).
 *   - When `audioRef` is supplied, ducks while narration plays.
 *   - Listens to `auditee:narration:start` / `:end` window events for ducking.
 */
export function BackgroundMusic({
  active = true,
  audioRef,
  gain = 0.28,
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
    let stepTimer: ReturnType<typeof setInterval> | null = null;
    let eagerStartTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;
    const cleanups: (() => void)[] = [];

    // ----- Music: D major, I-vi-IV-V (D - Bm - G - A) ---------------------
    // Two bars per chord; slow build. Tempo ~68 BPM => 60/68 = 0.882s/beat.
    // We step every half-beat (eighth) = ~441ms. Four eighths per chord-bar
    // pair gives a peaceful feel. Round to 450ms.
    const STEP_MS = 450;
    const STEPS_PER_CHORD = 8; // 8 eighths = 4 beats × 1 bar each chord
    // Roots (low octave) for sub-bass: D2, B1, G1, A1
    const ROOTS = [73.42, 61.74, 49.0, 55.0];
    // Pad triads (mid octave, voiced higher): D maj add9, B min7, G maj7, A sus2/major
    const PAD: number[][] = [
      [293.66, 369.99, 440.0, 587.33], // D F# A D (octave)
      [246.94, 293.66, 369.99, 493.88], // B D F# B
      [196.0, 246.94, 293.66, 392.0],  // G B D G
      [220.0, 277.18, 329.63, 440.0],  // A C# E A
    ];
    // Sparkle melody — D major scale, pentatonic-flavoured, hopeful arc:
    // D5 F#5 A5 B5 D6 B5 A5 F#5  per chord (transposed implicitly via pad blend)
    const SPARKLE = [587.33, 739.99, 880.0, 987.77, 1174.66, 987.77, 880.0, 739.99];

    let step = 0;

    function build() {
      ctx = new AC();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      masterRef.current = master;

      // Warm reverb-ish: a little stereo widening via two delays.
      const padBus = ctx.createGain();
      padBus.gain.value = 0.95;
      padBus.connect(master);

      const sparkleBus = ctx.createGain();
      sparkleBus.gain.value = 0.55;
      const sparkleHi = ctx.createBiquadFilter();
      sparkleHi.type = 'highpass';
      sparkleHi.frequency.value = 600;
      sparkleHi.connect(sparkleBus);
      sparkleBus.connect(master);

      const subBus = ctx.createGain();
      subBus.gain.value = 0.45;
      subBus.connect(master);

      // Gentle tape-style delay for sparkle
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.42;
      const fb = ctx.createGain();
      fb.gain.value = 0.22;
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      delay.connect(fb).connect(delay);
      delay.connect(wet).connect(master);
      sparkleBus.connect(delay);

      // ----- Sustained pad (continuous, fades chord-to-chord) --------------
      const padOscs: { osc: OscillatorNode; g: GainNode }[] = [];
      // 4 voices for current chord
      for (let v = 0; v < 4; v++) {
        const osc = ctx.createOscillator();
        osc.type = v % 2 === 0 ? 'sine' : 'triangle';
        const g = ctx.createGain();
        g.gain.value = 0;
        osc.connect(g).connect(padBus);
        osc.start();
        padOscs.push({ osc, g });
      }

      function setPadChord(chordIdx: number, when: number) {
        const chord = PAD[chordIdx];
        for (let v = 0; v < 4; v++) {
          padOscs[v].osc.frequency.setTargetAtTime(chord[v], when, 0.4);
          // Gentle voice-mixing — voicing 0/3 louder for fundamental
          const target = v === 0 || v === 3 ? 0.18 : 0.13;
          padOscs[v].g.gain.cancelScheduledValues(when);
          padOscs[v].g.gain.linearRampToValueAtTime(target, when + 1.2);
        }
      }

      // Sub-bass pluck on each chord root (very soft)
      function playSub(freq: number, when: number) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, when);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.55, when + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
        o.connect(g).connect(subBus);
        o.start(when);
        o.stop(when + 1.7);
      }

      // FM bell-piano sparkle note
      function playBell(freq: number, when: number, vel = 1) {
        // Carrier
        const car = ctx.createOscillator();
        car.type = 'sine';
        car.frequency.setValueAtTime(freq, when);
        // Modulator -> frequency
        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.setValueAtTime(freq * 2.01, when);
        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(freq * 1.6, when);
        modGain.gain.exponentialRampToValueAtTime(0.5, when + 0.9);
        mod.connect(modGain).connect(car.frequency);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(0.32 * vel, when + 0.012);
        env.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);

        car.connect(env).connect(sparkleHi);
        car.start(when);
        mod.start(when);
        car.stop(when + 1.9);
        mod.stop(when + 1.9);
      }

      // Initial pad
      setPadChord(0, ctx.currentTime);
      playSub(ROOTS[0], ctx.currentTime + 0.05);

      // Sequencer
      stepTimer = setInterval(() => {
        const t = ctx.currentTime + 0.02;
        const chordIdx = Math.floor(step / STEPS_PER_CHORD) % 4;
        const localStep = step % STEPS_PER_CHORD;

        if (localStep === 0) {
          setPadChord(chordIdx, t);
          playSub(ROOTS[chordIdx], t);
        }
        // Sparkle every step but skip a couple to give breath
        if (localStep !== 3 && localStep !== 7) {
          const note = SPARKLE[localStep] || SPARKLE[0];
          // Bend melody to chord by detuning slightly
          const detune = chordIdx === 1 ? -2 : chordIdx === 2 ? -5 : chordIdx === 3 ? -3 : 0;
          const f = note * Math.pow(2, detune / 12);
          playBell(f, t, 0.55 + (localStep === 0 ? 0.45 : 0.3));
        }
        step += 1;
      }, STEP_MS);

      cleanups.push(() => {
        padOscs.forEach((p) => { try { p.osc.stop(); } catch { /* noop */ } });
      });
    }

    function onStart() {
      if (startedRef.current) return;
      if (!mounted) return;
      startedRef.current = true;
      try {
        build();
        const m = masterRef.current!;
        const target = audioRef?.current && !audioRef.current.paused ? gain * 0.35 : gain;
        targetGainRef.current = gain;
        m.gain.cancelScheduledValues(ctx.currentTime);
        m.gain.setValueAtTime(0, ctx.currentTime);
        m.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.6);
      } catch { /* noop */ }
    }

    const onGesture = () => onStart();
    window.addEventListener('click', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    window.addEventListener('touchstart', onGesture, { once: true });

    // Try eager start (if audio policy allows; otherwise waits for gesture)
    eagerStartTimer = setTimeout(() => onStart(), 50);

    function duck() {
      if (!ctxRef.current || !masterRef.current) return;
      const m = masterRef.current;
      m.gain.cancelScheduledValues(ctxRef.current.currentTime);
      m.gain.linearRampToValueAtTime(targetGainRef.current * 0.22, ctxRef.current.currentTime + 0.25);
    }
    function unduck() {
      if (!ctxRef.current || !masterRef.current) return;
      const m = masterRef.current;
      m.gain.cancelScheduledValues(ctxRef.current.currentTime);
      m.gain.linearRampToValueAtTime(targetGainRef.current, ctxRef.current.currentTime + 0.6);
    }

    window.addEventListener('auditee:narration:start', duck);
    window.addEventListener('auditee:narration:end', unduck);

    let audioCleanup: (() => void) | undefined;
    if (audioRef?.current) {
      const el = audioRef.current;
      const onPlay = () => duck();
      const onPause = () => unduck();
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      el.addEventListener('ended', onPause);
      audioCleanup = () => {
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
        el.removeEventListener('ended', onPause);
      };
    }

    return () => {
      mounted = false;
      if (eagerStartTimer) clearTimeout(eagerStartTimer);
      if (stepTimer) clearInterval(stepTimer);
      window.removeEventListener('auditee:narration:start', duck);
      window.removeEventListener('auditee:narration:end', unduck);
      window.removeEventListener('click', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.removeEventListener('touchstart', onGesture);
      audioCleanup?.();
      cleanups.forEach((fn) => fn());
      try { ctxRef.current?.close(); } catch { /* noop */ }
      ctxRef.current = null;
      masterRef.current = null;
      startedRef.current = false;
    };
  }, [active, audioRef, gain]);

  return null;
}
