import { useState } from "react";
import { Linkedin, Facebook, Twitter, Send, Instagram, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Network =
  | "linkedin" | "whatsapp" | "facebook" | "pinterest"
  | "reddit" | "telegram" | "x" | "instagram";

type ShareButtonsProps = {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  className?: string;
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.6-3.9-3.5-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5s-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.2.2 2 3.1 4.9 4.4 1.8.8 2.5.9 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.2 9.3-.1-.8-.2-2 0-2.9.2-.8 1.2-5.2 1.2-5.2s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.5-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.5.1.1.1.2.1.3-.1.4-.3 1.1-.3 1.3-.1.2-.2.3-.4.2-1.4-.7-2.3-2.7-2.3-4.4 0-3.6 2.6-6.9 7.5-6.9 3.9 0 7 2.8 7 6.5 0 3.9-2.5 7.1-5.9 7.1-1.2 0-2.3-.6-2.6-1.3l-.7 2.7c-.3 1-1 2.3-1.5 3.1.6.2 1.3.3 1.9.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
  </svg>
);

const RedditIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M22 12c0-1.1-.9-2-2-2-.5 0-1 .2-1.4.6-1.4-1-3.3-1.6-5.3-1.7l.9-4.3 3 .6c0 .8.7 1.4 1.5 1.4s1.5-.7 1.5-1.5S19.5 3.5 18.7 3.5c-.6 0-1.1.3-1.4.8l-3.4-.7c-.2 0-.3.1-.4.2L12.5 8.7c-2 .1-3.9.7-5.4 1.7-.4-.3-.9-.5-1.4-.5-1.1 0-2 .9-2 2 0 .8.5 1.5 1.2 1.8 0 .2-.1.4-.1.6 0 3 3.6 5.5 8 5.5s8-2.5 8-5.5c0-.2 0-.4-.1-.6.8-.3 1.3-1 1.3-1.8zM7 13.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5S7 14.3 7 13.5zm8.5 4.1c-1 1-2.4 1.4-3.5 1.4s-2.5-.4-3.5-1.4c-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 .8.8 1.9 1.1 2.8 1.1s2-.4 2.8-1.1c.2-.2.5-.2.7 0 .2.2.2.5 0 .7zm0-2.6c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
  </svg>
);

function networkUrl(net: Network, url: string, title: string, description: string): string | null {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const d = encodeURIComponent(description);
  switch (net) {
    case "linkedin":  return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "whatsapp":  return `https://api.whatsapp.com/send?text=${t}%20${u}`;
    case "facebook":  return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "pinterest": return `https://pinterest.com/pin/create/button/?url=${u}&description=${d || t}`;
    case "reddit":    return `https://www.reddit.com/submit?url=${u}&title=${t}`;
    case "telegram":  return `https://t.me/share/url?url=${u}&text=${t}`;
    case "x":         return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "instagram": return null; // Instagram has no public web-share intent — handled by copy-to-clipboard
  }
}

const NETWORKS: { key: Network; label: string; bg: string; hover: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "linkedin",  label: "LinkedIn",  bg: "bg-[#0a66c2]", hover: "hover:bg-[#0a5cad]", Icon: Linkedin },
  { key: "whatsapp",  label: "WhatsApp",  bg: "bg-[#25D366]", hover: "hover:bg-[#1fb858]", Icon: WhatsAppIcon },
  { key: "facebook",  label: "Facebook",  bg: "bg-[#1877f2]", hover: "hover:bg-[#1565d8]", Icon: Facebook },
  { key: "pinterest", label: "Pinterest", bg: "bg-[#E60023]", hover: "hover:bg-[#c8001f]", Icon: PinterestIcon },
  { key: "reddit",    label: "Reddit",    bg: "bg-[#FF4500]", hover: "hover:bg-[#e03d00]", Icon: RedditIcon },
  { key: "telegram",  label: "Telegram",  bg: "bg-[#26A5E4]", hover: "hover:bg-[#1d92cb]", Icon: Send },
  { key: "x",         label: "X",         bg: "bg-slate-900", hover: "hover:bg-black",     Icon: Twitter },
  {
    key: "instagram", label: "Instagram",
    bg: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]",
    hover: "hover:opacity-90",
    Icon: Instagram,
  },
];

export function ShareButtons({ url, title, description = "", className = "" }: ShareButtonsProps) {
  const [copiedNet, setCopiedNet] = useState<Network | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const fullUrl =
    url.startsWith("http")
      ? url
      : (typeof window !== "undefined" ? `${window.location.origin}${url}` : url);

  const handleClick = async (net: Network, e: React.MouseEvent) => {
    if (net === "instagram") {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopiedNet("instagram");
        setTimeout(() => setCopiedNet(null), 1800);
      } catch {/* ignore */}
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      return;
    }
    // Other networks: open the share intent in a popup window
    const target = networkUrl(net, fullUrl, title, description);
    if (!target) return;
    e.preventDefault();
    window.open(target, "share-popup", "width=620,height=560,noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {/* ignore */}
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-testid="share-buttons">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 mr-1">Share</span>
      {NETWORKS.map(({ key, label, bg, hover, Icon }) => {
        const href = networkUrl(key, fullUrl, title, description) ?? "#";
        return (
          <a
            key={key}
            href={href}
            onClick={(e) => handleClick(key, e)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${label}`}
            title={key === "instagram" ? "Copy link & open Instagram" : `Share on ${label}`}
            data-testid={`share-${key}`}
            className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-all ${bg} ${hover} hover:-translate-y-0.5`}
          >
            <Icon className="h-4 w-4" />
            {copiedNet === key && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white">
                Link copied
              </span>
            )}
          </a>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copyLink}
        data-testid="share-copy-link"
        className="ml-1 h-9 gap-1.5 text-xs"
      >
        {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <LinkIcon className="h-3.5 w-3.5" />}
        {linkCopied ? "Copied!" : "Copy link"}
      </Button>
    </div>
  );
}
