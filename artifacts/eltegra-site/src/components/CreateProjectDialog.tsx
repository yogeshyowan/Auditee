import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getListProjectsQueryKey } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProjectContext } from "@/lib/project-context";
import { Loader2 } from "lucide-react";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedProject {
  id: string;
  name: string;
  slug: string;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { setProjectId } = useProjectContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");

  const createMut = useMutation({
    mutationFn: async (payload: { name: string; description: string; owner: string }) => {
      const r = await fetch(`${apiBase}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description || undefined,
          owner: payload.owner || undefined,
        }),
      });
      const text = await r.text();
      if (!r.ok) {
        let msg = `Failed (${r.status})`;
        try {
          const j = JSON.parse(text);
          msg = j.error ?? msg;
        } catch {}
        throw new Error(msg);
      }
      return JSON.parse(text) as CreatedProject;
    },
    onSuccess: async (proj) => {
      // Refresh the projects list and WAIT for the refetch so the new project
      // is in `allProjects` before we set it as active. Otherwise the auto-
      // select effect in ProjectProvider will see an unknown id and snap back
      // to the first connected project.
      await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      setProjectId(proj.id);
      toast({ title: "Project created", description: `${proj.name} is ready — connect a source to start.` });
      setName("");
      setDescription("");
      setOwner("");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not create project", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = name.trim().length >= 2 && !createMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="create-project-dialog">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            Each project is its own workspace — separate requirements, sources, audits and dashboards.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            createMut.mutate({ name: name.trim(), description: description.trim(), owner: owner.trim() });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="cp-name">Project name *</Label>
            <Input
              id="cp-name"
              placeholder="e.g. Atlas — Trade Settlement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="create-project-name"
              autoFocus
              required
              minLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">Description</Label>
            <Textarea
              id="cp-desc"
              placeholder="What does this project do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="create-project-description"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-owner">Owner (optional)</Label>
            <Input
              id="cp-owner"
              placeholder="Team or person responsible"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              data-testid="create-project-owner"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={createMut.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} data-testid="create-project-submit">
              {createMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
