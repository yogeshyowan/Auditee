import { useState } from "react";
import { Trash2, MessageSquare, Send } from "lucide-react";
import { useComments, useAddComment, useDeleteComment } from "@/lib/wave1-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function Comments({
  entityType,
  entityId,
  projectId,
}: {
  entityType: string;
  entityId: string;
  projectId?: string | null;
}) {
  const { data, isLoading } = useComments(entityType, entityId);
  const add = useAddComment();
  const del = useDeleteComment();
  const [text, setText] = useState("");

  function submit() {
    const body = text.trim();
    if (!body) return;
    add.mutate(
      { entityType, entityId, projectId, body, author: "You" },
      { onSuccess: () => setText("") },
    );
  }

  return (
    <div className="border-t border-slate-200 pt-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
        <MessageSquare className="h-4 w-4" />
        Comments {data?.comments.length ? <Badge variant="secondary">{data.comments.length}</Badge> : null}
      </div>
      <div className="space-y-3 mb-3">
        {isLoading && <div className="text-xs text-slate-500">Loading…</div>}
        {data?.comments.length === 0 && (
          <div className="text-xs text-slate-500 italic">No comments yet. Mention teammates with @name.</div>
        )}
        {data?.comments.map((c) => (
          <div key={c.id} className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-slate-900">{c.author}</div>
              <button
                className="text-slate-400 hover:text-red-600"
                onClick={() => del.mutate(c.id)}
                aria-label="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="whitespace-pre-wrap text-slate-700">{c.body}</div>
            {c.mentions.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {c.mentions.map((m) => (
                  <Badge key={m} variant="outline" className="text-[10px]">@{m}</Badge>
                ))}
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment… use @name to mention"
          rows={2}
          className="text-sm"
        />
        <Button onClick={submit} disabled={add.isPending || text.trim().length === 0} size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {add.error && <div className="text-xs text-red-600 mt-2">{(add.error as Error).message}</div>}
    </div>
  );
}
