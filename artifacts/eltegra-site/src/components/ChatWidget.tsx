import { useState, useEffect } from "react";
import { MessageSquare, X, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      minimize?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      onLoad?: () => void;
      isChatHidden?: () => boolean;
    };
  }
}

export function ChatWidget() {
  const [tawkReady, setTawkReady] = useState(false);

  useEffect(() => {
    const check = setInterval(() => {
      if (window.Tawk_API?.maximize) {
        setTawkReady(true);
        clearInterval(check);
      }
    }, 300);
    return () => clearInterval(check);
  }, []);

  const handleClick = () => {
    if (window.Tawk_API?.maximize) {
      window.Tawk_API.maximize();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleClick}
        aria-label="Chat with Customer Support"
        data-testid="chat-toggle"
        title="Chat with Customer Support"
        className="flex items-center gap-2.5 rounded-full bg-emerald-600 text-white px-5 py-3 shadow-lg hover:shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all duration-200 font-semibold text-sm"
      >
        {!tawkReady ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
        <span>Chat with Customer Support</span>
      </button>
    </div>
  );
}
