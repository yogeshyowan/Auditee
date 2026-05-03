import { useEffect, useRef } from 'react';

/**
 * Ambient cinematic pad synced to the narration audio element.
 * Starts when audio starts playing, pauses when audio pauses.
 * Three detuned voices in a minor-add9 voicing (A2, E3, C4, G4).
 */
export function BackgroundMusic({
  active = true,
  audioRef,
}: {
  active?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
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

      // Warm lowpass
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      filter.Q.value = 0.6;
      filter.connect(master);

      // Slow LFO on filter cutoff
      filterLfo = ctx.createOscillator();
      filterLfo.frequency.value = 0.05;
      const flGain = ctx.createGain();
      flGain.gain.value = 380;
      filterLfo.connect(flGain);
      flGain.connect(filter.frequency);
      filterLfo.start();

      // Chord: A2, E3, C4, G4
      const chord = [55, 82.4, 130.8, 196];
      voices = chord.map((freq, i) => {
        const vGain = ctx.createGain();
        vGain.gain.value = i === 0 ? 0.55 : 0.32;
        vGain.connect(filter);

        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        o1.type = 'sawtooth';
        o2.type = 'sawtooth';
        o1.frequency.value = freq;
        o2.frequency.value = freq;
        o1.detune.value = -8;
        o2.detune.value = 8;

        const ampLfo = ctx.createOscillator();
        ampLfo.frequency.value = 0.07 + i * 0.018;
        const aGain = ctx.createGain();
        aGain.gain.value = 0.12;
        ampLfo.connect(aGain);
        aGain.connect(vGain.gain);

        o1.connect(vGain);
        o2.connect(vGain);
        o1.start();
        o2.start();
        ampLfo.start();

        return { o1, o2, ampLfo };
      });

      // Sub pulse at 60 BPM
      const pulseGain = ctx.createGain();
      pulseGain.gain.value = 0;
      pulseGain.connect(master);
      pulse = ctx.createOscillator();
      pulse.type = 'sine';
      pulse.frequency.value = 41.2;
      pulse.connect(pulseGain);
      pulse.start();

      pulseInterval = setInterval(() => {
        const now = ctx.currentTime;
        pulseGain.gain.cancelScheduledValues(now);
        pulseGain.gain.setValueAtTime(0, now);
        pulseGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      }, 2000);
    }

    function fadeIn() {
      if (!masterRef.current || !ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
      masterRef.current.gain.linearRampToValueAtTime(0.07, now + 2.5);
    }

    function fadeOut() {
      if (!masterRef.current || !ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
      masterRef.current.gain.linearRampToValueAtTime(0, now + 0.8);
    }

    function startAudio() {
      if (startedRef.current) {
        // resume from pause
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
      }, 900);
    }

    const el = audioRef?.current;
    if (el) {
      el.addEventListener('play', startAudio);
      el.addEventListener('pause', pauseAudio);
      el.addEventListener('ended', pauseAudio);
      // If already playing when component mounts
      if (!el.paused) startAudio();
    } else {
      // No audioRef — start immediately on first gesture
      const gesture = () => { startAudio(); };
      window.addEventListener('click', gesture, { once: true });
      window.addEventListener('keydown', gesture, { once: true });
    }

    return () => {
      clearInterval(pulseInterval);
      if (el) {
        el.removeEventListener('play', startAudio);
        el.removeEventListener('pause', pauseAudio);
        el.removeEventListener('ended', pauseAudio);
      }
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
  }, [active, audioRef]);

  return null;
}
