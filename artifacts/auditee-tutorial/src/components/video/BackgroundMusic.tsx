import { useEffect, useRef } from 'react';

/**
 * Mild, energetic ambient pad. Bright add9 voicing (D2, A2, F#3, A3, C#4)
 * with a slow soft pulse — keeps energy without distracting from voice-over.
 *
 * Defaults to autostart on first user gesture (no audioRef needed) so the
 * music plays even when modules don't have their own narration audio
 * element to attach to. When an audioRef IS supplied, it follows that
 * element's play/pause/ended events.
 */
export function BackgroundMusic({
  active = true,
  audioRef,
  gain = 0.16,
}: {
  active?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  gain?: number;
}) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;

    let ctx: AudioContext;
    let filterLfo: OscillatorNode;
    let pulse: OscillatorNode;
    let voices: Array<{ o1: OscillatorNode; o2: OscillatorNode; ampLfo: OscillatorNode }> = [];
    let pulseInterval: ReturnType<typeof setInterval>;

    function build() {
      ctx = new AC();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      masterRef.current = master;

      // Brighter open-air filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;
      filter.Q.value = 0.7;
      filter.connect(master);

      // Slow LFO on filter cutoff — gentle "breathing"
      filterLfo = ctx.createOscillator();
      filterLfo.frequency.value = 0.06;
      const flGain = ctx.createGain();
      flGain.gain.value = 480;
      filterLfo.connect(flGain);
      flGain.connect(filter.frequency);
      filterLfo.start();

      // D-major-add9 voicing for a brighter, hopeful pad: D2, A2, F#3, A3, C#4
      const chord = [73.42, 110.0, 185.0, 220.0, 277.18];
      voices = chord.map((freq, i) => {
        const vGain = ctx.createGain();
        vGain.gain.value = i === 0 ? 0.40 : 0.26;
        vGain.connect(filter);

        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        // Mix of triangle (warm) + sawtooth (presence)
        o1.type = i === 0 ? 'triangle' : 'sawtooth';
        o2.type = 'triangle';
        o1.frequency.value = freq;
        o2.frequency.value = freq;
        o1.detune.value = -7;
        o2.detune.value = 7;

        const ampLfo = ctx.createOscillator();
        ampLfo.frequency.value = 0.08 + i * 0.022;
        const aGain = ctx.createGain();
        aGain.gain.value = 0.10;
        ampLfo.connect(aGain);
        aGain.connect(vGain.gain);

        o1.connect(vGain);
        o2.connect(vGain);
        o1.start();
        o2.start();
        ampLfo.start();

        return { o1, o2, ampLfo };
      });

      // Soft sub-pulse at ~70 BPM — gives the pad a pulse like a slow heartbeat
      const pulseGain = ctx.createGain();
      pulseGain.gain.value = 0;
      pulseGain.connect(master);
      pulse = ctx.createOscillator();
      pulse.type = 'sine';
      pulse.frequency.value = 55; // A1
      pulse.connect(pulseGain);
      pulse.start();

      pulseInterval = setInterval(() => {
        const now = ctx.currentTime;
        pulseGain.gain.cancelScheduledValues(now);
        pulseGain.gain.setValueAtTime(0, now);
        pulseGain.gain.linearRampToValueAtTime(0.22, now + 0.04);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      }, 1700);
    }

    function fadeIn() {
      if (!masterRef.current || !ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
      masterRef.current.gain.linearRampToValueAtTime(gain, now + 2.0);
    }

    function fadeOut() {
      if (!masterRef.current || !ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
      masterRef.current.gain.linearRampToValueAtTime(0, now + 0.7);
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

    const el = audioRef?.current;
    if (el) {
      el.addEventListener('play', startAudio);
      el.addEventListener('pause', pauseAudio);
      el.addEventListener('ended', pauseAudio);
      if (!el.paused) startAudio();
    }
    // Always also auto-start on the first user gesture (works even when no audioRef supplied)
    const gesture = () => { startAudio(); };
    window.addEventListener('click', gesture, { once: true });
    window.addEventListener('keydown', gesture, { once: true });
    window.addEventListener('touchstart', gesture, { once: true });

    return () => {
      clearInterval(pulseInterval);
      if (el) {
        el.removeEventListener('play', startAudio);
        el.removeEventListener('pause', pauseAudio);
        el.removeEventListener('ended', pauseAudio);
      }
      window.removeEventListener('click', gesture);
      window.removeEventListener('keydown', gesture);
      window.removeEventListener('touchstart', gesture);
      try { filterLfo?.stop(); } catch {/* */}
      try { pulse?.stop(); } catch {/* */}
      voices.forEach(v => {
        try { v.o1.stop(); } catch {/* */}
        try { v.o2.stop(); } catch {/* */}
        try { v.ampLfo.stop(); } catch {/* */}
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
