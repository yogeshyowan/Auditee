import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  problem: 12000,
  intro: 10000,
  casestudy: 25000,
  outcome: 10000,
  cta: 8000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  problem: Scene1,
  intro: Scene2,
  casestudy: Scene3,
  outcome: Scene4,
  cta: Scene5,
};

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

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] font-display text-white">
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
    </div>
  );
}
