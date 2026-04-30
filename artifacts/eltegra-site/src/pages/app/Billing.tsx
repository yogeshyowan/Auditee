import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth, useUser, UserButton } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useGetBillingMe,
  useCreateBillingCancel,
  getGetBillingMeQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Trash2,
  Users,
  Sparkles,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

const ROLE_OPTIONS = ["owner", "admin", "editor", "viewer"] as const;
type Role = (typeof ROLE_OPTIONS)[number];

const ROLE_BLURB: Record<Role, string> = {
  owner: "Full control: billing, plan, SSO, ownership transfer.",
  admin: "Manage members, change roles, view audit logs, edit content.",
  editor: "Create and edit requirements, run AI generations.",
  viewer: "Read-only access to all workspace content.",
};

interface MemberRow {
  id: string;
  email: string | null;
  userId: string;
  role: string;
  addedAt: string;
}

interface Permissions {
  canManageBilling: boolean;
  canManageMembers: boolean;
  canChangeRoles: boolean;
  canManageSso: boolean;
  canViewAuditLog: boolean;
  canEditContent: boolean;
  canViewContent: boolean;
}

interface WorkspaceMe {
  workspace: {
    id: string;
    name: string;
    plan: "free" | "standard" | "professional" | "enterprise";
    seatLimit: number;
    ownerUserId: string;
    planActivatedAt: string | null;
    creditsUsed: number;
  };
  role: Role;
  permissions: Permissions;
  seatsUsed: number;
  seatLimit: number;
  creditsUsed: number;
  creditsLimit: number;
  members: MemberRow[];
}

const PLAN_DETAILS: Record<
  WorkspaceMe["workspace"]["plan"],
  { label: string; price: string; cadence: string; seats: number; blurb: string; highlight?: boolean }
> = {
  free: {
    label: "Free",
    price: "₹0",
    cadence: "forever",
    seats: 1,
    blurb: "10 AI credits to start. Top up ₹420 for 10 more, no expiry.",
  },
  standard: {
    label: "Standard",
    price: "₹1,999",
    cadence: "/month",
    seats: 1,
    blurb: "50 AI credits per month for solo builders.",
  },
  professional: {
    label: "Professional",
    price: "₹7,999",
    cadence: "/month",
    seats: 4,
    blurb: "200 AI credits per month for audit-ready engineering teams.",
    highlight: true,
  },
  enterprise: {
    label: "Enterprise",
    price: "Custom",
    cadence: "",
    seats: 20,
    blurb: "1,000 AI credits per month for regulated multi-program orgs.",
  },
};

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function authedFetch(path: string, token: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: "include" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export default function BillingPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");

  useEffect(() => {
    document.title = "Billing & Team — Auditee";
  }, []);

  const meQuery = useQuery<WorkspaceMe>({
    queryKey: ["workspace", "me"],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      return authedFetch("/workspace/me", token);
    },
  });

  const billingQuery = useGetBillingMe({
    query: { queryKey: getGetBillingMeQueryKey(), enabled: isLoaded },
  });
  const cancelMutation = useCreateBillingCancel({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Cancellation scheduled",
          description: "Your subscription will end at the close of the current billing cycle.",
        });
        void billingQuery.refetch();
        qc.invalidateQueries({ queryKey: ["workspace", "me"] });
      },
      onError: (err: Error) =>
        toast({
          title: "Could not cancel",
          description: err.message,
          variant: "destructive",
        }),
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (vars: { email: string; role: Role }) => {
      const token = await getToken();
      return authedFetch("/workspace/members", token, {
        method: "POST",
        body: JSON.stringify(vars),
      });
    },
    onSuccess: () => {
      setInviteEmail("");
      toast({ title: "Invite sent", description: "Member added to your workspace." });
      qc.invalidateQueries({ queryKey: ["workspace", "me"] });
    },
    onError: (err: Error) => toast({ title: "Could not invite", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return authedFetch(`/workspace/members/${id}`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Member removed" });
      qc.invalidateQueries({ queryKey: ["workspace", "me"] });
    },
    onError: (err: Error) => toast({ title: "Could not remove", description: err.message, variant: "destructive" }),
  });

  const roleMutation = useMutation({
    mutationFn: async (vars: { id: string; role: Role }) => {
      const token = await getToken();
      return authedFetch(`/workspace/members/${vars.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ role: vars.role }),
      });
    },
    onSuccess: () => {
      toast({ title: "Role updated" });
      qc.invalidateQueries({ queryKey: ["workspace", "me"] });
    },
    onError: (err: Error) => toast({ title: "Could not change role", description: err.message, variant: "destructive" }),
  });

  if (!isLoaded || meQuery.isLoading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (meQuery.isError || !meQuery.data) return <div className="p-8 text-red-600">Failed to load workspace.</div>;

  const me = meQuery.data;
  const atCap = me.seatsUsed >= me.seatLimit;
  const isOwner = me.role === "owner";
  const canManageMembers = me.permissions.canManageMembers;
  const canChangeRoles = me.permissions.canChangeRoles;
  const ownerCount = me.members.filter((m) => m.role === "owner").length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Billing & Team</h1>
          <p className="mt-1 text-slate-500">Manage your workspace plan, seats, and team members.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:inline">{user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton />
        </div>
      </header>

      <Card data-testid="card-current-plan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Current plan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Plan</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold text-slate-900">{PLAN_DETAILS[me.workspace.plan].label}</span>
              <Badge variant="secondary">
                {PLAN_DETAILS[me.workspace.plan].price}
                {PLAN_DETAILS[me.workspace.plan].cadence}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Seats</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900" data-testid="text-seats-usage">
              {me.seatsUsed} / {me.seatLimit} used
            </div>
            {atCap && <div className="mt-1 text-xs text-amber-700">Seat limit reached — upgrade to invite more members.</div>}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">AI credits</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900" data-testid="text-credits-usage">
              {me.creditsLimit === -1 ? "Unlimited" : `${me.creditsUsed} / ${me.creditsLimit} used`}
            </div>
            {me.creditsLimit !== -1 && me.creditsUsed >= me.creditsLimit && (
              <div className="mt-1 text-xs text-amber-700">Out of credits — upgrade for unlimited generations.</div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Workspace</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{me.workspace.name}</div>
            <div className="mt-1 text-xs text-slate-500 capitalize">Your role: {me.role}</div>
          </div>
        </CardContent>
      </Card>

      {/* Active subscription / order panel — only shows for paid plans
          or for free workspaces that have a subscription history row. */}
      {(billingQuery.data?.subscription || billingQuery.data?.planExpiresAt) && (
        <Card data-testid="card-subscription">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {billingQuery.data?.subscription ? (
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Plan</div>
                  <div className="mt-1 text-lg font-semibold capitalize text-slate-900" data-testid="text-sub-plan">
                    {billingQuery.data.subscription.plan}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Billing</div>
                  <div className="mt-1 text-lg font-semibold capitalize text-slate-900" data-testid="text-sub-cadence">
                    {billingQuery.data.subscription.cadence}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant={
                        billingQuery.data.subscription.status === "active" ||
                        billingQuery.data.subscription.status === "authenticated"
                          ? "default"
                          : "secondary"
                      }
                      data-testid="text-sub-status"
                    >
                      {billingQuery.data.subscription.status}
                    </Badge>
                  </div>
                  {billingQuery.data.subscription.cancelAtPeriodEnd && (
                    <div className="mt-1 text-xs text-amber-700">Cancels at period end.</div>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {billingQuery.data.subscription.cadence === "annual" ? "Expires" : "Next renewal"}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900" data-testid="text-sub-renewal">
                    {formatDate(
                      billingQuery.data.subscription.currentPeriodEnd ??
                        billingQuery.data.planExpiresAt,
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Annual access expires</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatDate(billingQuery.data?.planExpiresAt)}
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  Annual plans don't auto-renew (RBI ₹15,000 auto-debit cap). We'll email
                  you 14 days before this date with a one-click renewal link.
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <Link href="/pricing">
                <Button variant="outline" data-testid="button-change-plan">
                  Change plan
                </Button>
              </Link>
              {billingQuery.data?.subscription &&
                billingQuery.data.subscription.cadence === "monthly" &&
                !billingQuery.data.subscription.cancelAtPeriodEnd &&
                isOwner && (
                  <Button
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => {
                      if (
                        confirm(
                          "Cancel your subscription? You'll keep access until the end of the current billing cycle.",
                        )
                      ) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    {cancelMutation.isPending ? "Cancelling…" : "Cancel subscription"}
                  </Button>
                )}
              {billingQuery.data?.subscription?.cancelAtPeriodEnd && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Subscription scheduled to cancel.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Plans</h2>
            <p className="text-sm text-slate-500">
              Upgrade or change your plan from the pricing page — payments are processed securely via Razorpay.
            </p>
          </div>
          <Link href="/pricing">
            <Button data-testid="button-view-pricing">View pricing</Button>
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(["standard", "professional", "enterprise"] as Array<WorkspaceMe["workspace"]["plan"]>).map((tier) => {
            const meta = PLAN_DETAILS[tier];
            const active = me.workspace.plan === tier;
            return (
              <Card
                key={tier}
                className={`relative ${meta.highlight ? "border-primary shadow-lg" : ""} ${active ? "ring-2 ring-primary" : ""}`}
                data-testid={`card-plan-${tier}`}
              >
                {active && (
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{meta.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold text-slate-900">{meta.price}</span>
                    {meta.cadence && (
                      <span className="ml-1 text-sm text-slate-500">{meta.cadence}</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Up to {meta.seats} {meta.seats === 1 ? "user" : "users"}
                  </div>
                  <p className="text-sm text-slate-600">{meta.blurb}</p>
                  {tier === "enterprise" && (
                    <ul className="space-y-1 text-xs text-slate-500">
                      <li>• SSO (SAML/OIDC)</li>
                      <li>• Audit log export</li>
                      <li>• Priority support + DPA</li>
                    </ul>
                  )}
                  {tier === "enterprise" ? (
                    <a href="mailto:sales@auditee.site?subject=Enterprise%20plan%20enquiry">
                      <Button
                        className="w-full"
                        variant="outline"
                        data-testid={`button-activate-${tier}`}
                      >
                        Contact sales
                      </Button>
                    </a>
                  ) : (
                    <Link href="/pricing">
                      <Button
                        className="w-full"
                        variant={active ? "outline" : "default"}
                        disabled={!isOwner}
                        data-testid={`button-activate-${tier}`}
                      >
                        {active ? "Current plan" : `Upgrade to ${meta.label}`}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {!isOwner && <p className="mt-3 text-xs text-slate-500">Only the workspace owner can change the plan.</p>}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!inviteEmail.trim()) return;
              inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
            }}
          >
            <div className="flex-1 min-w-[240px]">
              <label className="mb-1 block text-sm font-medium text-slate-700">Invite by email</label>
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={!canManageMembers || atCap}
                data-testid="input-invite-email"
              />
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger disabled={!canManageMembers || atCap} data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["admin", "editor", "viewer"] as Role[]).map((r) => (
                    <SelectItem key={r} value={r} disabled={r === "admin" && !isOwner}>
                      <span className="capitalize">{r}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={!canManageMembers || atCap || inviteMutation.isPending || !inviteEmail.trim()}
              data-testid="button-send-invite"
            >
              {inviteMutation.isPending ? "Inviting…" : "Send invite"}
            </Button>
          </form>
          {atCap && canManageMembers && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              You're at your seat limit. Activate a higher plan above to add more team members.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3 w-44">Role</th>
                  <th className="p-3">Added</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {me.members.map((m) => {
                  const isLastOwner = m.role === "owner" && ownerCount <= 1;
                  const canEditThisRole =
                    canChangeRoles && !isLastOwner && (isOwner || (m.role !== "owner" && m.role !== "admin"));
                  const canRemoveThis =
                    canManageMembers && m.role !== "owner" && (isOwner || m.role !== "admin");
                  return (
                    <tr key={m.id} className="border-t border-slate-100" data-testid={`row-member-${m.id}`}>
                      <td className="p-3 font-medium text-slate-900">{m.email ?? m.userId}</td>
                      <td className="p-3">
                        {canEditThisRole ? (
                          <Select
                            value={m.role}
                            onValueChange={(v) => roleMutation.mutate({ id: m.id, role: v as Role })}
                          >
                            <SelectTrigger className="h-8" data-testid={`select-role-${m.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((r) => (
                                <SelectItem
                                  key={r}
                                  value={r}
                                  disabled={(r === "owner" || r === "admin") && !isOwner}
                                >
                                  <span className="capitalize">{r}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize text-slate-600">{m.role}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{new Date(m.addedAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {canRemoveThis && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMutation.mutate(m.id)}
                            disabled={removeMutation.isPending}
                            data-testid={`button-remove-${m.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-slate-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-primary" /> Role permissions
            </div>
            <dl className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
              {ROLE_OPTIONS.map((r) => (
                <div key={r}>
                  <dt className="font-semibold capitalize text-slate-800">{r}</dt>
                  <dd>{ROLE_BLURB[r]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
