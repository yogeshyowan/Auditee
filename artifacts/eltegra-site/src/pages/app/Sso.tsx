import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { KeyRound, Sparkles, ShieldCheck, ExternalLink, Lock, ShieldAlert } from "lucide-react";

interface WorkspaceMe {
  workspace: {
    id: string;
    plan: "free" | "standard" | "professional" | "enterprise";
    ssoEnabled: boolean;
    ssoDomain: string | null;
  };
  role: "owner" | "admin" | "editor" | "viewer";
  permissions: { canManageSso: boolean };
  enterpriseFeatures: { sso: boolean };
}

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function authedFetch(path: string, token: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: "include" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const d = await res.json(); if (d?.error) msg = d.error; } catch {/**/}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export default function SsoPage() {
  const { getToken, isLoaded } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => { document.title = "SSO & Security — Auditee"; }, []);

  const meQuery = useQuery<WorkspaceMe>({
    queryKey: ["workspace", "me"],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      return authedFetch("/workspace/me", token);
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      setDomain(meQuery.data.workspace.ssoDomain ?? "");
      setEnabled(meQuery.data.workspace.ssoEnabled);
    }
  }, [meQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return authedFetch("/workspace/sso", token, {
        method: "POST",
        body: JSON.stringify({ ssoEnabled: enabled, ssoDomain: domain.trim() || null }),
      });
    },
    onSuccess: () => {
      toast({ title: "SSO settings saved" });
      qc.invalidateQueries({ queryKey: ["workspace", "me"] });
    },
    onError: (err: Error) => toast({ title: "Could not save", description: err.message, variant: "destructive" }),
  });

  if (!isLoaded || meQuery.isLoading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (meQuery.isError || !meQuery.data) return <div className="p-8 text-red-600">Failed to load workspace.</div>;

  const me = meQuery.data;
  const isEnterprise = me.workspace.plan === "enterprise";
  const canManage = me.permissions.canManageSso;

  if (!isEnterprise) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-primary" /> SSO is an Enterprise feature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>
              Auditee Enterprise integrates with any SAML 2.0 or OIDC identity provider — Okta, Azure AD,
              Google Workspace, OneLogin, JumpCloud, or your own. Domain-based auto-routing means
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">@your-company.com</code> users
              are sent straight to your IdP.
            </p>
            <Link href="/app/billing">
              <Button data-testid="button-upgrade-from-sso">Upgrade to Enterprise</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <ShieldAlert className="h-5 w-5" /> Owner role required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            Only the workspace owner can configure SSO. Ask the owner to grant you ownership or to make changes on your behalf.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="h-7 w-7 text-primary" /> SSO & Security
        </h1>
        <p className="mt-1 text-slate-500">Configure SAML / OIDC single sign-on for your workspace.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Domain auto-routing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email domain</label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="acme.com"
              data-testid="input-sso-domain"
            />
            <p className="mt-1 text-xs text-slate-500">
              Users signing in with an <code className="rounded bg-slate-100 px-1">@{domain || "your-company.com"}</code>
              {" "}email will be routed to your identity provider.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} data-testid="switch-sso-enabled" id="sso-toggle" />
            <label htmlFor="sso-toggle" className="text-sm font-medium text-slate-700">
              Require SSO for {domain || "your domain"}
            </label>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-sso"
          >
            {saveMutation.isPending ? "Saving…" : "Save SSO settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Configure your IdP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            Auditee uses Clerk Enterprise SSO under the hood. Once you've set the domain above, complete IdP
            setup with one of these providers — your account manager will share the ACS URL and Entity ID
            for your workspace.
          </p>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              In your IdP admin console, create a new SAML 2.0 application named <strong>Auditee</strong>.
            </li>
            <li>
              Set <code className="rounded bg-slate-100 px-1">ACS URL</code> and{" "}
              <code className="rounded bg-slate-100 px-1">Audience URI</code> to the values your CSM provides.
            </li>
            <li>
              Map the SAML attributes <code className="rounded bg-slate-100 px-1">email</code>,{" "}
              <code className="rounded bg-slate-100 px-1">first_name</code>, and{" "}
              <code className="rounded bg-slate-100 px-1">last_name</code>.
            </li>
            <li>Send the IdP metadata XML to your account manager. We finalize the connection within 1 business day.</li>
            <li>Toggle "Require SSO" above when you're ready to enforce it for the entire domain.</li>
          </ol>
          <div className="grid gap-3 pt-2 md:grid-cols-3">
            {[
              { name: "Okta", href: "https://help.okta.com/en-us/content/topics/apps/apps_overview_get_started.htm" },
              { name: "Microsoft Entra ID", href: "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/add-application-portal-setup-sso" },
              { name: "Google Workspace", href: "https://support.google.com/a/answer/6087519?hl=en" },
            ].map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-primary hover:text-primary"
                data-testid={`link-idp-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {p.name} setup guide <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
