import VideoWithControls from "@/components/video/VideoWithControls";
import { ModuleTutorial } from "@/components/video/ModuleTutorial";
import { ShortPlayer, ShortFrame } from "@/components/video/shorts/ShortPlayer";
import { FullVideoPlayer } from "@/components/video/full/FullVideoPlayer";
import { ShortsIndex } from "@/pages/ShortsIndex";
import { MODULE_ORDER } from "@/lib/shortsConfig";
import type { ModuleKey } from "@/lib/demoUseCases";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const mod = params.get('module');
  const shorts = params.get('shorts');
  const full = params.get('full');

  if (full) {
    return <FullVideoPlayer />;
  }

  if (shorts !== null) {
    if (shorts && (MODULE_ORDER as string[]).includes(shorts)) {
      return (
        <ShortFrame>
          <ShortPlayer slug={shorts as ModuleKey} />
        </ShortFrame>
      );
    }
    return <ShortsIndex />;
  }

  if (mod) {
    return <ModuleTutorial />;
  }

  return <VideoWithControls />;
}
