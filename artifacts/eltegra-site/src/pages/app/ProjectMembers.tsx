import { useEffect, useState } from "react";
import { useProjectContext, type ProjectRole } from "@/lib/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, ShieldAlert, Trash2 } from "lucide-react";

interface MemberRow {
  id: string;
  projectId: string;
  userId: string;
  email: string | null;
  role: ProjectRole;
  addedBy: string | null;
  createdAt: string;
}

const ROLE_LABEL: Record<ProjectRole, string> = {
  manager: "Manager",
  developer: "Developer",
  reviewer: "Reviewer",
  auditor: "Auditor",
};

const ROLE_HINT: Record<ProjectRole, string> = {
  manager: "Full project control — including managing members.",
  developer: "Read + write project content (requirements, sources, reports).",
  reviewer: "Read + comment / approve. Cannot edit content.",
  auditor: "Read-only.",
};

function roleBadge(role: ProjectRole | null | undefined) {
  if (!role) return <Badge variant="outline">None</Badge>;
  const cls =
    role === "manager"
      ? "bg-violet-100 text-violet-800"
      : role === "developer"
        ? "bg-emerald-100 text-emerald-800"
        : role === "reviewer"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-200 text-slate-800";
  return <Badge className={cls}>{ROLE_LABEL[role]}</Badge>;
}

export default function ProjectMembers() {
  const { projectId, allProjects, effectiveRole, canManageMembers } = useProjectContext();
  const project = allProjects.find((p) => p.id === projectId);

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("developer");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMembers(Array.isArray(data?.members) ? data.members : []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMembers([]);
    if (projectId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !inviteEmail.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed (HTTP ${res.status})`);
      }
      setInviteEmail("");
      setInviteRole("developer");
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(member: MemberRow, role: ProjectRole) {
    if (!projectId || role === member.role) return;
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${member.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed (HTTP ${res.status})`);
      }
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update role");
    }
  }

  async function removeMember(member: MemberRow) {
    if (!projectId) return;
    if (!confirm(`Remove ${member.email ?? member.userId} from this project?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${member.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed (HTTP ${res.status})`);
      }
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Failed to remove member");
    }
  }

  if (!projectId) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-slate-500">
        Select a project from the sidebar to manage its members.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Project Members</h1>
          {roleBadge(effectiveRole)}
        </div>
        <p className="text-sm text-slate-600">
          Manage who has access to <span className="font-medium">{project?.name ?? projectId}</span>{" "}
          and what they can do here.
        </p>
      </div>

      {!canManageMembers && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            You don't have permission to add or remove members on this project. Ask a project
            Manager (or your workspace owner / admin) to grant you access.
          </div>
        </div>
      )}

      {canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addMember} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                required
                data-testid="invite-email"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ProjectRole)}>
                <SelectTrigger className="sm:w-[180px]" data-testid="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["manager", "developer", "reviewer", "auditor"] as ProjectRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={submitting} data-testid="invite-submit">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                <span className="ml-2">Add</span>
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">{ROLE_HINT[inviteRole]}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : members.length === 0 ? (
            <div className="text-sm text-slate-500">
              No explicit members yet. Workspace owners and admins are auto-Managers on every
              project.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {members.map((m) => (
                <li key={m.id} className="py-3 flex items-center gap-3" data-testid={`member-row-${m.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {m.email ?? m.userId}
                    </div>
                    <div className="text-xs text-slate-500">
                      Added {new Date(m.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {canManageMembers ? (
                    <Select value={m.role} onValueChange={(v) => changeRole(m, v as ProjectRole)}>
                      <SelectTrigger className="w-[140px]" data-testid={`member-role-${m.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["manager", "developer", "reviewer", "auditor"] as ProjectRole[]).map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    roleBadge(m.role)
                  )}
                  {canManageMembers && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(m)}
                      data-testid={`member-remove-${m.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
