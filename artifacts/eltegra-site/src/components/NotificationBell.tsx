import { useNotifications, useMarkRead, useMarkAllRead } from "@/lib/wave1-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { useLocation } from "wouter";

const KIND_COLORS: Record<string, string> = {
  workflow_blocked: "text-amber-700",
  workflow_completed: "text-emerald-700",
  capa_created: "text-orange-700",
  audit_completed: "text-blue-700",
  mention: "text-violet-700",
};

export function NotificationBell({ recipient }: { recipient: string }) {
  const { data } = useNotifications(recipient);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const [, navigate] = useLocation();

  const items = data?.notifications ?? [];
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-2 hover:bg-slate-100 transition" aria-label="Notifications">
          <Bell className="h-4 w-4 text-slate-700" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[10px] font-semibold text-white flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAll.mutate(recipient)}>
              <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>}
          {items.map((n) => (
            <button
              key={n.id}
              className={`block w-full text-left px-3 py-2 border-b hover:bg-slate-50 ${n.readAt ? "opacity-70" : "bg-blue-50/40"}`}
              onClick={() => {
                if (!n.readAt) markRead.mutate(n.id);
                if (n.link) navigate(n.link);
              }}
            >
              <div className={`text-xs uppercase tracking-wide ${KIND_COLORS[n.kind] ?? "text-slate-600"}`}>
                {n.kind.replace(/_/g, " ")}
              </div>
              <div className="text-sm font-medium leading-tight">{n.title}</div>
              {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
              <div className="text-[10px] text-muted-foreground mt-1">
                {new Date(n.createdAt).toLocaleString()} · channels: {n.channels.join(", ")}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
