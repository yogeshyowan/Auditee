import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { CaseIntake } from './video_scenes/CaseIntake';
import { CaseRequirements } from './video_scenes/CaseRequirements';
import { CaseTraceability } from './video_scenes/CaseTraceability';
import { CaseAudit } from './video_scenes/CaseAudit';
import { CaseReport } from './video_scenes/CaseReport';
import { CaseGaps } from './video_scenes/CaseGaps';
import { CaseCapa } from './video_scenes/CaseCapa';
import { CaseWorkflow } from './video_scenes/CaseWorkflow';
import { CaseConclude } from './video_scenes/CaseConclude';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { BackgroundMusic } from './BackgroundMusic';
import { Captions } from './Captions';

export const SCENE_DURATIONS = {
  problem: 14000,
  intro: 11000,
  case_intake: 6000,
  case_requirements: 9500,
  case_traceability: 9000,
  case_audit: 9500,
  case_report: 9500,
  case_gaps: 7500,
  case_capa: 8500,
  case_workflow: 8500,
  case_conclude: 6000,
  outcome: 7000,
  cta: 6000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  problem: Scene1,
  intro: Scene2,
  case_intake: CaseIntake,
  case_requirements: CaseRequirements,
  case_traceability: CaseTraceability,
  case_audit: CaseAudit,
  case_report: CaseReport,
  case_gaps: CaseGaps,
  case_capa: CaseCapa,
  case_workflow: CaseWorkflow,
  case_conclude: CaseConclude,
  outcome: Scene4,
  cta: Scene5,
};

const NARRATION_SRC = `${import.meta.env.BASE_URL}audio/narration.mp3`;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  // Reset audio at the start of every loop (when we land on the first scene).
  useEffect(() => {
    if (baseSceneKey === 'problem' && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        const p = audioRef.current.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        /* noop */
      }
    }
  }, [baseSceneKey]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
      <audio ref={audioRef} src={NARRATION_SRC} autoPlay preload="auto" />
      <BackgroundMusic />

      {/* Persistent Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'var(--color-accent)' }}
          animate={{
            x: ['0%', '10%', '-5%', '0%'],
            y: ['0%', '-10%', '5%', '0%'],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'var(--color-accent-alt)' }}
          animate={{
            x: ['0%', '-10%', '5%', '0%'],
            y: ['0%', '10%', '-5%', '0%'],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      <Captions audioRef={audioRef} />
    </div>
  );
}
