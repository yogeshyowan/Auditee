import VideoWithControls from "@/components/video/VideoWithControls";
import { ModuleTutorial } from "@/components/video/ModuleTutorial";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const mod = params.get('module');

  if (mod) {
    return <ModuleTutorial />;
  }

  return <VideoWithControls />;
}
