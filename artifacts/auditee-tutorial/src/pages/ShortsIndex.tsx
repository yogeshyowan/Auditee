import { MODULE_ORDER, SHORT_HOOKS } from '@/lib/shortsConfig';
import { getStory } from '@/lib/demoUseCases';

const BASE = import.meta.env.BASE_URL;

export function ShortsIndex() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 overflow-y-auto" style={{ overflowY: 'auto' }}>
      <header className="max-w-5xl mx-auto text-center mb-12">
        <div className="text-xs uppercase tracking-[0.4em] text-violet-300 mb-3">For YouTube · Reels · TikTok</div>
        <h1 className="text-5xl font-black tracking-tight">Auditee Shorts Library</h1>
        <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
          14 vertical shorts (~38s each) — hook, real demo project walkthrough, free-trial CTA.
          Plus one full-length walk-through of the entire platform.
        </p>
        <a
          href={`${BASE}?full=1`}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-8 py-4 text-base font-black text-slate-950 shadow-2xl hover:scale-105 transition-transform"
          data-testid="link-full-video"
        >
          ▶ Play full demo tour (~6 min)
        </a>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULE_ORDER.map((slug, i) => {
          const story = getStory(slug);
          const hook = SHORT_HOOKS[slug];
          return (
            <a
              key={slug}
              href={`${BASE}?shorts=${slug}`}
              className="group relative rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-800 transition-colors overflow-hidden"
              data-testid={`short-card-${slug}`}
              style={{ aspectRatio: '9 / 16', maxHeight: '420px' }}
            >
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle at 50% 30%, ${hook.accent}40 0%, transparent 60%)` }}
              />
              <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                <div className="text-xs uppercase tracking-[0.3em] text-white/50 mb-2">
                  Short #{i + 1}
                </div>
                <div className="text-6xl mb-3">{hook.emoji}</div>
                <div className="text-xl font-black leading-tight" style={{ color: hook.accent }}>
                  {story.project.split(' — ')[0]}
                </div>
                <div className="mt-2 text-sm text-white/80 font-semibold leading-snug">
                  {hook.punch}
                </div>
                <div className="absolute bottom-4 inline-flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-widest">
                  ▶ Play short
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <footer className="max-w-5xl mx-auto mt-16 text-center text-white/40 text-sm">
        Tip — open any short in fullscreen and screen-record at 1080×1920 for upload to YouTube Shorts / Reels / TikTok.
        For the long video, record at 1920×1080.
      </footer>
    </div>
  );
}
