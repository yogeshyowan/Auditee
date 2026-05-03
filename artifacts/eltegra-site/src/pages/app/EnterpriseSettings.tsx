import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Building2,
  Sparkles,
  ShieldAlert,
  KeyRound,
  Webhook,
  BrainCircuit,
  ShieldCheck,
  Globe2,
  LockKeyhole,
  Trash2,
  Copy,
  Network,
  Palette,
  Activity,
  DatabaseBackup,
  UserMinus,
} from "lucide-react";

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

interface WorkspaceMe {
  workspace: {
    id: string;
    plan: "free" | "standard" | "professional" | "enterprise";
    samlIdpEntityId: string | null;
    samlIdpSsoUrl: string | null;
    samlIdpX509Cert: string | null;
    samlIdpMetadataXml: string | null;
    siemWebhookUrl: string | null;
    mfaRequired: boolean;
    dataRegion: string | null;
    cmkKid: string | null;
    ipAllowlist: string[] | null;
    brandingLogoUrl: string | null;
    brandingPrimaryColor: string | null;
    brandingProductName: string | null;
  };
  role: "owner" | "admin" | "editor" | "viewer";
  permissions: { canManageSso: boolean; canManageBilling: boolean };
  enterpriseFeatures: {
    saml: boolean;
    scim: boolean;
    siem: boolean;
    byo_llm: boolean;
    mfa_policy: boolean;
    data_residency: boolean;
    cmk: boolean;
  };
}

interface ScimToken { id: string; label: string; lastUsedAt: string | null; createdAt: string; }
interface LlmConfig {
  id: string;
  provider: string;
  baseUrl: string | null;
  model: string | null;
  enabled: boolean;
  createdAt: string;
}

const LLM_PROVIDERS = ["openai", "anthropic", "azure_openai", "bedrock", "openrouter", "custom"] as const;
const REGIONS = [
  { v: "us", label: "United States" },
  { v: "eu", label: "European Union" },
  { v: "in", label: "India" },
  { v: "ap", label: "Asia-Pacific" },
];

export default function EnterpriseSettingsPage() {
  const { getToken, isLoaded } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => { document.title = "Enterprise Settings — Auditee"; }, []);

  const meQuery = useQuery<WorkspaceMe>({
    queryKey: ["workspace", "me"],
    enabled: isLoaded,
    queryFn: async () => authedFetch("/workspace/me", await getToken()),
  });

  if (!isLoaded || meQuery.isLoading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (meQuery.isError || !meQuery.data) return <div className="p-8 text-red-600">Failed to load workspace.</div>;

  const me = meQuery.data;
  const isEnterprise = me.workspace.plan === "enterprise";
  const isAdmin = me.role === "owner" || me.role === "admin";

  if (!isEnterprise) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-primary" /> Enterprise Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>
              SAML SSO, SCIM provisioning, SIEM streaming, BYO-LLM, enforced MFA, data residency, and customer-managed encryption keys
              are part of the Auditee Enterprise plan. Talk to sales to enable them for your workspace.
            </p>
            <Link href="/app/billing">
              <Button data-testid="button-upgrade-from-enterprise">Upgrade to Enterprise</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <ShieldAlert className="h-5 w-5" /> Admin role required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            Only workspace admins or the owner can change enterprise settings.
          </CardContent>
        </Card>
      </div>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["workspace", "me"] });
  const ws = me.workspace;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" /> Enterprise Settings
        </h1>
        <p className="mt-1 text-slate-500">
          Configure SAML, SCIM, SIEM streaming, BYO-LLM, MFA enforcement, data residency, and customer-managed keys.
        </p>
      </header>

      <Tabs defaultValue="saml">
        <TabsList className="flex-wrap">
          <TabsTrigger value="saml" data-testid="tab-saml"><KeyRound className="mr-1 h-4 w-4" /> SAML SSO</TabsTrigger>
          <TabsTrigger value="oidc" data-testid="tab-oidc"><KeyRound className="mr-1 h-4 w-4" /> OIDC SSO</TabsTrigger>
          <TabsTrigger value="scim" data-testid="tab-scim"><ShieldCheck className="mr-1 h-4 w-4" /> SCIM</TabsTrigger>
          <TabsTrigger value="siem" data-testid="tab-siem"><Webhook className="mr-1 h-4 w-4" /> SIEM</TabsTrigger>
          <TabsTrigger value="llm" data-testid="tab-llm"><BrainCircuit className="mr-1 h-4 w-4" /> BYO-LLM</TabsTrigger>
          <TabsTrigger value="mfa" data-testid="tab-mfa"><ShieldCheck className="mr-1 h-4 w-4" /> MFA</TabsTrigger>
          <TabsTrigger value="region" data-testid="tab-region"><Globe2 className="mr-1 h-4 w-4" /> Data Region</TabsTrigger>
          <TabsTrigger value="cmk" data-testid="tab-cmk"><LockKeyhole className="mr-1 h-4 w-4" /> Encryption Key</TabsTrigger>
          <TabsTrigger value="ipallow" data-testid="tab-ipallow"><Network className="mr-1 h-4 w-4" /> IP Allowlist</TabsTrigger>
          <TabsTrigger value="branding" data-testid="tab-branding"><Palette className="mr-1 h-4 w-4" /> Branding</TabsTrigger>
          <TabsTrigger value="sla" data-testid="tab-sla"><Activity className="mr-1 h-4 w-4" /> SLA / Uptime</TabsTrigger>
          <TabsTrigger value="backups" data-testid="tab-backups"><DatabaseBackup className="mr-1 h-4 w-4" /> Backups</TabsTrigger>
          <TabsTrigger value="dsar" data-testid="tab-dsar"><UserMinus className="mr-1 h-4 w-4" /> Privacy / DSAR</TabsTrigger>
        </TabsList>

        <TabsContent value="saml"><SamlPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="oidc"><OidcPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="scim"><ScimPanel getToken={getToken} toast={toast} /></TabsContent>
        <TabsContent value="siem"><SiemPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="llm"><LlmPanel getToken={getToken} toast={toast} /></TabsContent>
        <TabsContent value="mfa"><MfaPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="region"><RegionPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="cmk"><CmkPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="ipallow"><IpAllowPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="branding"><BrandingPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="sla"><SlaPanel getToken={getToken} /></TabsContent>
        <TabsContent value="backups"><BackupsPanel getToken={getToken} toast={toast} /></TabsContent>
        <TabsContent value="dsar"><DsarPanel getToken={getToken} toast={toast} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── SAML ────────────────────────────────────────────────────────────────
function SamlPanel({ ws, getToken, toast, onSaved }: any) {
  const [entityId, setEntityId] = useState(ws.samlIdpEntityId ?? "");
  const [ssoUrl, setSsoUrl] = useState(ws.samlIdpSsoUrl ?? "");
  const [cert, setCert] = useState(ws.samlIdpX509Cert ?? "");
  const [metadata, setMetadata] = useState(ws.samlIdpMetadataXml ?? "");

  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/saml-config", await getToken(), {
      method: "POST",
      body: JSON.stringify({
        samlIdpEntityId: entityId.trim() || null,
        samlIdpSsoUrl: ssoUrl.trim() || null,
        samlIdpX509Cert: cert.trim() || null,
        samlIdpMetadataXml: metadata.trim() || null,
      }),
    }),
    onSuccess: () => { toast({ title: "SAML configuration saved" }); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const spMetaUrl = `${apiBase}/sso/saml/${ws.id}/metadata`;
  const acsUrl = `${apiBase}/sso/saml/${ws.id}/acs`;
  const loginUrl = `${apiBase}/sso/saml/${ws.id}/login`;

  return (
    <Card>
      <CardHeader><CardTitle>SAML 2.0 Identity Provider</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <div><strong>SP metadata:</strong> <code>{spMetaUrl}</code></div>
          <div><strong>ACS URL:</strong> <code>{acsUrl}</code></div>
          <div><strong>SP-initiated login:</strong> <code>{loginUrl}</code></div>
        </div>
        <Field label="IdP Entity ID" value={entityId} onChange={setEntityId} placeholder="https://idp.example.com/saml" testId="input-saml-entity" />
        <Field label="IdP SSO URL" value={ssoUrl} onChange={setSsoUrl} placeholder="https://idp.example.com/sso" testId="input-saml-ssourl" />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">IdP X.509 signing certificate (PEM)</label>
          <Textarea rows={5} value={cert} onChange={(e) => setCert(e.target.value)} placeholder="-----BEGIN CERTIFICATE-----..." data-testid="input-saml-cert" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Or paste IdP metadata XML</label>
          <Textarea rows={6} value={metadata} onChange={(e) => setMetadata(e.target.value)} placeholder="<EntityDescriptor>...</EntityDescriptor>" data-testid="input-saml-metadata" />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-saml">
          {save.isPending ? "Saving…" : "Save SAML config"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SCIM tokens ─────────────────────────────────────────────────────────
function ScimPanel({ getToken, toast }: any) {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);

  const tokensQuery = useQuery<{ tokens: ScimToken[] }>({
    queryKey: ["scim-tokens"],
    queryFn: async () => authedFetch("/workspace/scim-tokens", await getToken()),
  });

  const create = useMutation({
    mutationFn: async () => authedFetch("/workspace/scim-tokens", await getToken(), {
      method: "POST", body: JSON.stringify({ label: label.trim() || "SCIM token" }),
    }),
    onSuccess: (r: any) => { setNewToken(r.token); setLabel(""); qc.invalidateQueries({ queryKey: ["scim-tokens"] }); },
    onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => authedFetch(`/workspace/scim-tokens/${id}`, await getToken(), { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scim-tokens"] }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>SCIM 2.0 provisioning tokens</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Point your IdP's SCIM connector at <code className="rounded bg-slate-100 px-1">{apiBase}/scim/v2</code>{" "}
          and authenticate with one of the bearer tokens below.
        </p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Token label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Okta production" data-testid="input-scim-label" />
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending} data-testid="button-create-scim">
            {create.isPending ? "Creating…" : "Create token"}
          </Button>
        </div>
        {newToken && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Copy this token now — it will not be shown again:</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-white px-2 py-1 text-xs">{newToken}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newToken); toast({ title: "Copied" }); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {(tokensQuery.data?.tokens ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium text-slate-800">{t.label}</div>
                <div className="text-xs text-slate-500">
                  Created {new Date(t.createdAt).toLocaleDateString()} · Last used {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : "never"}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => revoke.mutate(t.id)} data-testid={`button-revoke-${t.id}`}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {!tokensQuery.data?.tokens?.length && <p className="text-sm text-slate-500">No tokens yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── SIEM ────────────────────────────────────────────────────────────────
function SiemPanel({ ws, getToken, toast, onSaved }: any) {
  const [url, setUrl] = useState(ws.siemWebhookUrl ?? "");
  const [secret, setSecret] = useState("");
  const [format, setFormat] = useState<string>(ws.siemFormat ?? "generic");

  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/siem", await getToken(), {
      method: "POST", body: JSON.stringify({ url: url.trim() || null, secret: secret.trim() || null, format }),
    }),
    onSuccess: () => { toast({ title: "SIEM webhook saved" }); setSecret(""); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  const test = useMutation({
    mutationFn: async () => authedFetch("/workspace/siem/test", await getToken(), { method: "POST" }),
    onSuccess: () => toast({ title: "Test event dispatched" }),
    onError: (e: Error) => toast({ title: "Test failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>SIEM webhook streaming</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Every audit log entry is signed with HMAC-SHA256 and POSTed to your SIEM (Splunk, Datadog, Sumo Logic, custom HEC).
          The signature is sent in the <code className="rounded bg-slate-100 px-1">X-Auditee-Signature</code> header.
        </p>
        <Field label="Webhook URL" value={url} onChange={setUrl} placeholder="https://siem.example.com/hec" testId="input-siem-url" />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">HMAC secret (write-only; leave blank to keep current)</label>
          <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="••••••••" data-testid="input-siem-secret" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Payload format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            data-testid="select-siem-format"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="generic">Generic JSON (Auditee native)</option>
            <option value="splunk_hec">Splunk HEC envelope</option>
            <option value="datadog">Datadog Logs</option>
            <option value="elastic">Elastic Common Schema (ECS)</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">Splunk HEC also receives the secret as a Splunk-token Authorization header.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-siem">
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending || !ws.siemWebhookUrl} data-testid="button-test-siem">
            Send test event
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── BYO-LLM ─────────────────────────────────────────────────────────────
function LlmPanel({ getToken, toast }: any) {
  const qc = useQueryClient();
  const [provider, setProvider] = useState<string>("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [enabled, setEnabled] = useState(true);

  const listQuery = useQuery<{ configs: LlmConfig[] }>({
    queryKey: ["llm-configs"],
    queryFn: async () => authedFetch("/workspace/llm-configs", await getToken()),
  });

  const create = useMutation({
    mutationFn: async () => authedFetch("/workspace/llm-configs", await getToken(), {
      method: "POST",
      body: JSON.stringify({
        provider, apiKey, enabled,
        baseUrl: baseUrl.trim() || null, model: model.trim() || null,
      }),
    }),
    onSuccess: () => { toast({ title: "LLM config saved" }); setApiKey(""); qc.invalidateQueries({ queryKey: ["llm-configs"] }); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => authedFetch(`/workspace/llm-configs/${id}`, await getToken(), { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["llm-configs"] }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Bring-your-own LLM</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          When enabled, all AI generation for this workspace uses your provider and API key first.
          The platform-managed model remains available as automatic fallback for resilience.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Provider</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger data-testid="select-llm-provider"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LLM_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Field label="Model (optional)" value={model} onChange={setModel} placeholder="gpt-4o, claude-3-5-sonnet, ..." testId="input-llm-model" />
          <Field label="Base URL (optional, for Azure / proxies)" value={baseUrl} onChange={setBaseUrl} placeholder="https://your-resource.openai.azure.com" testId="input-llm-baseurl" />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">API key (write-only)</label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." data-testid="input-llm-apikey" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} id="llm-enabled" data-testid="switch-llm-enabled" />
          <label htmlFor="llm-enabled" className="text-sm">Enabled</label>
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending || !apiKey} data-testid="button-save-llm">
          {create.isPending ? "Saving…" : "Save config"}
        </Button>
        <div className="space-y-2 pt-2">
          {(listQuery.data?.configs ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium text-slate-800">{c.provider} {c.model ? `· ${c.model}` : ""} {c.enabled ? "" : "(disabled)"}</div>
                <div className="text-xs text-slate-500">{c.baseUrl ?? "default endpoint"}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(c.id)} data-testid={`button-remove-llm-${c.id}`}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {!listQuery.data?.configs?.length && <p className="text-sm text-slate-500">Using platform-managed models.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MFA ─────────────────────────────────────────────────────────────────
function MfaPanel({ ws, getToken, toast, onSaved }: any) {
  const [required, setRequired] = useState(!!ws.mfaRequired);
  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/mfa", await getToken(), {
      method: "POST", body: JSON.stringify({ mfaRequired: required }),
    }),
    onSuccess: () => { toast({ title: "MFA policy saved" }); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Multi-factor authentication policy</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          When enforced, every signed-in user must have a second factor enrolled in their identity (Clerk).
          Mutating API requests from users without MFA are rejected with HTTP 403.
        </p>
        <div className="flex items-center gap-3">
          <Switch checked={required} onCheckedChange={setRequired} id="mfa-required" data-testid="switch-mfa-required" />
          <label htmlFor="mfa-required" className="text-sm font-medium">Require MFA for all members (owner-only setting)</label>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-mfa">
          {save.isPending ? "Saving…" : "Save policy"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Data residency ──────────────────────────────────────────────────────
function RegionPanel({ ws, getToken, toast, onSaved }: any) {
  const [region, setRegion] = useState<string>(ws.dataRegion ?? "us");
  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/region", await getToken(), {
      method: "POST", body: JSON.stringify({ dataRegion: region }),
    }),
    onSuccess: () => { toast({ title: "Data region updated" }); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Data residency</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Pin this workspace's data to a specific region. Replication and AI inference stay within the chosen region's pod.
        </p>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger data-testid="select-region"><SelectValue /></SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => <SelectItem key={r.v} value={r.v}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-region">
          {save.isPending ? "Saving…" : "Save region"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── CMK ─────────────────────────────────────────────────────────────────
function CmkPanel({ ws, getToken, toast, onSaved }: any) {
  const [kid, setKid] = useState(ws.cmkKid ?? "");
  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/encryption-key", await getToken(), {
      method: "POST", body: JSON.stringify({ cmkKid: kid.trim() || null }),
    }),
    onSuccess: () => { toast({ title: "Encryption key registered" }); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  return (
    <Card>
      <CardHeader><CardTitle>Customer-managed encryption key</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Register the KID of a key in your KMS (AWS KMS, GCP KMS, HashiCorp Vault). Auditee uses it as a per-tenant KEK for envelope
          encryption of sensitive fields. Rotate by registering a new KID.
        </p>
        <Field label="Key ID (KID)" value={kid} onChange={setKid} placeholder="arn:aws:kms:us-east-1:123:key/abcd..." testId="input-cmk-kid" />
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-cmk">
          {save.isPending ? "Saving…" : "Register key"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── helper ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, testId }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; testId?: string; }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testId} />
    </div>
  );
}

// ─── IP Allowlist ────────────────────────────────────────────────────────
function IpAllowPanel({ ws, getToken, toast, onSaved }: any) {
  const [text, setText] = useState((ws.ipAllowlist ?? []).join("\n"));
  const [force, setForce] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const list = text.split(/[\s,]+/).map((s: string) => s.trim()).filter(Boolean);
      const path = `/workspace/ip-allowlist${force ? "?force=true" : ""}`;
      return authedFetch(path, await getToken(), {
        method: "POST",
        body: JSON.stringify({ allowlist: list }),
      });
    },
    onSuccess: () => { toast({ title: "IP allowlist saved" }); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Network IP Allowlist</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Restrict workspace access to a list of IPv4 addresses or CIDR blocks (one per line).
          Leave empty to disable. Applies to all authenticated API requests for this workspace.
        </p>
        <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={"203.0.113.0/24\n198.51.100.42"} data-testid="input-ipallow" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} data-testid="check-ipallow-force" />
          I understand this list may not include my current IP (override self-lockout check)
        </label>
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-ipallow">
          {save.isPending ? "Saving…" : "Save allowlist"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── White-label Branding ────────────────────────────────────────────────
function BrandingPanel({ ws, getToken, toast, onSaved }: any) {
  const [name, setName] = useState(ws.brandingProductName ?? "");
  const [color, setColor] = useState(ws.brandingPrimaryColor ?? "#0ea5e9");
  const [logo, setLogo] = useState(ws.brandingLogoUrl ?? "");

  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/branding", await getToken(), {
      method: "POST",
      body: JSON.stringify({
        brandingProductName: name.trim() || null,
        brandingPrimaryColor: color.trim() || null,
        brandingLogoUrl: logo.trim() || null,
      }),
    }),
    onSuccess: () => { toast({ title: "Branding saved" }); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>White-label Branding</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label="Product name (overrides 'Auditee' in nav)" value={name} onChange={setName} placeholder="Acme Compliance" testId="input-brand-name" />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Primary brand color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-16 rounded border" data-testid="input-brand-color" />
            <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#0ea5e9" />
          </div>
        </div>
        <Field label="Logo URL (PNG/SVG, square, ≥256px)" value={logo} onChange={setLogo} placeholder="https://cdn.example.com/logo.png" testId="input-brand-logo" />
        {logo && <img src={logo} alt="Brand preview" className="h-16 w-16 rounded border bg-white object-contain p-1" />}
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-brand">
          {save.isPending ? "Saving…" : "Save branding"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── SLA / Uptime ────────────────────────────────────────────────────────
function SlaPanel({ getToken }: any) {
  const q = useQuery<{ windowDays: number; samples: number; healthy: number; uptimePct: number | null; slaTarget: number; recent: Array<{ sampledAt: string; healthy: boolean; durationMs: string | null; note: string | null }> }>({
    queryKey: ["uptime"],
    queryFn: async () => authedFetch("/workspace/uptime?days=30", await getToken()),
  });
  if (q.isLoading) return <div className="p-4 text-slate-500">Loading…</div>;
  if (q.isError || !q.data) return <div className="p-4 text-red-600">Failed to load uptime.</div>;
  const d = q.data;
  const pct = d.uptimePct === null ? "—" : `${d.uptimePct.toFixed(3)}%`;
  return (
    <Card>
      <CardHeader><CardTitle>Service-Level Uptime</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Stat label={`Last ${d.windowDays} days uptime`} value={pct} />
          <Stat label="SLA target" value={`${d.slaTarget}%`} />
          <Stat label="Health samples" value={`${d.healthy} / ${d.samples}`} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Recent samples</h3>
          <div className="max-h-72 overflow-auto rounded border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1 text-left">When</th><th className="px-2 py-1">Status</th><th className="px-2 py-1">Latency</th><th className="px-2 py-1 text-left">Note</th></tr></thead>
              <tbody>
                {d.recent.map((r, i) => (
                  <tr key={i} className="border-t" data-testid={`row-uptime-${i}`}>
                    <td className="px-2 py-1">{new Date(r.sampledAt).toLocaleString()}</td>
                    <td className="px-2 py-1 text-center">{r.healthy ? "✓" : "✗"}</td>
                    <td className="px-2 py-1 text-center">{r.durationMs ?? "—"}ms</td>
                    <td className="px-2 py-1 text-slate-500">{r.note ?? ""}</td>
                  </tr>
                ))}
                {d.recent.length === 0 && <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-500">No samples yet — first sample lands within 60s.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

// ─── Backups / DR ────────────────────────────────────────────────────────
function BackupsPanel({ getToken, toast }: any) {
  const qc = useQueryClient();
  const q = useQuery<{ rpoHours: number; rtoHours: number; snapshots: Array<{ id: string; kind: string; createdAt: string; sizeBytes: string | null; location: string | null; note: string | null }> }>({
    queryKey: ["backups"],
    queryFn: async () => authedFetch("/workspace/backups", await getToken()),
  });
  const trigger = useMutation({
    mutationFn: async () => authedFetch("/workspace/backups/trigger", await getToken(), { method: "POST", body: "{}" }),
    onSuccess: () => { toast({ title: "Backup triggered" }); qc.invalidateQueries({ queryKey: ["backups"] }); },
    onError: (e: Error) => toast({ title: "Trigger failed", description: e.message, variant: "destructive" }),
  });
  if (q.isLoading) return <div className="p-4 text-slate-500">Loading…</div>;
  if (q.isError || !q.data) return <div className="p-4 text-red-600">Failed to load backups.</div>;
  const d = q.data;
  return (
    <Card>
      <CardHeader><CardTitle>Backups & Disaster Recovery</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="RPO (Recovery Point)" value={`${d.rpoHours}h`} />
          <Stat label="RTO (Recovery Time)" value={`${d.rtoHours}h`} />
        </div>
        <Button onClick={() => trigger.mutate()} disabled={trigger.isPending} data-testid="button-trigger-backup">
          {trigger.isPending ? "Triggering…" : "Trigger on-demand snapshot"}
        </Button>
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Recent snapshots</h3>
          <div className="max-h-72 overflow-auto rounded border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-2 py-1 text-left">Created</th><th className="px-2 py-1">Kind</th><th className="px-2 py-1 text-left">Location</th><th className="px-2 py-1 text-left">Note</th></tr></thead>
              <tbody>
                {d.snapshots.map((s) => (
                  <tr key={s.id} className="border-t" data-testid={`row-backup-${s.id}`}>
                    <td className="px-2 py-1">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-1 text-center">{s.kind}</td>
                    <td className="px-2 py-1 font-mono text-[11px] text-slate-600">{s.location ?? ""}</td>
                    <td className="px-2 py-1 text-slate-500">{s.note ?? ""}</td>
                  </tr>
                ))}
                {d.snapshots.length === 0 && <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-500">No snapshots yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── DSAR / right-to-erasure ─────────────────────────────────────────────
function DsarPanel({ getToken, toast }: any) {
  const [email, setEmail] = useState("");
  const [exportData, setExportData] = useState<any>(null);

  const fetchData = useMutation({
    mutationFn: async () => authedFetch("/workspace/dsar", await getToken(), {
      method: "POST", body: JSON.stringify({ subjectEmail: email.trim() }),
    }),
    onSuccess: (r: any) => { setExportData(r); toast({ title: "DSAR export ready" }); },
    onError: (e: Error) => toast({ title: "DSAR failed", description: e.message, variant: "destructive" }),
  });
  const erase = useMutation({
    mutationFn: async () => authedFetch("/workspace/dsar/erasure", await getToken(), {
      method: "POST", body: JSON.stringify({ subjectEmail: email.trim(), confirm: true }),
    }),
    onSuccess: (r: any) => { toast({ title: `Erased ${r.erased} record(s)` }); setExportData(null); },
    onError: (e: Error) => toast({ title: "Erasure failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>GDPR — Data Subject Requests</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Look up everything you store about a data subject (Article 15 access)
          and execute a right-to-erasure request (Article 17). Workspace owner
          accounts are protected from erasure.
        </p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" data-testid="input-dsar-email" />
          </div>
          <Button onClick={() => fetchData.mutate()} disabled={fetchData.isPending || !email} data-testid="button-dsar-export">
            {fetchData.isPending ? "Loading…" : "Export data"}
          </Button>
        </div>
        {exportData && (
          <div className="space-y-3">
            <div className="rounded border bg-slate-50 p-3 text-xs">
              <div><strong>Request ID:</strong> {exportData.requestId}</div>
              <div><strong>Matched members:</strong> {exportData.matchedMembers}</div>
            </div>
            <pre className="max-h-64 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(exportData.export, null, 2)}
            </pre>
            <Button variant="destructive" onClick={() => { if (confirm(`Permanently erase ${email} from this workspace?`)) erase.mutate(); }} disabled={erase.isPending} data-testid="button-dsar-erase">
              {erase.isPending ? "Erasing…" : "Execute right-to-erasure"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── OIDC SSO ───────────────────────────────────────────────────────────
function OidcPanel({ ws, getToken, toast, onSaved }: any) {
  const [issuer, setIssuer] = useState(ws.oidcIssuer ?? "");
  const [clientId, setClientId] = useState(ws.oidcClientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [cfg, setCfg] = useState<{ hasClientSecret: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await authedFetch("/workspace/oidc-config", await getToken());
        setCfg(r);
      } catch { /* ignore */ }
    })();
  }, [getToken]);

  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/oidc-config", await getToken(), {
      method: "POST",
      body: JSON.stringify({
        oidcIssuer: issuer.trim() || null,
        oidcClientId: clientId.trim() || null,
        oidcClientSecret: clientSecret.length > 0 ? clientSecret : undefined,
      }),
    }),
    onSuccess: () => { toast({ title: "OIDC saved" }); setClientSecret(""); onSaved(); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const loginUrl = `${import.meta.env.BASE_URL}api/sso/oidc/${ws.id}/login`;
  const callbackUrl = `${window.location.origin}${import.meta.env.BASE_URL}api/sso/oidc/${ws.id}/callback`;

  return (
    <Card>
      <CardHeader><CardTitle>OIDC SSO (OpenID Connect)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Authorization Code flow with PKCE. Configure your IdP (Okta, Auth0, Azure AD, Google Workspace, Keycloak) with the
          callback URL below, then paste the issuer URL and client credentials.
        </p>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
          <div><strong>Redirect / callback URL:</strong> <code className="break-all">{callbackUrl}</code></div>
          <div className="mt-1"><strong>Login URL (start sign-in):</strong> <code className="break-all">{loginUrl}</code></div>
        </div>
        <Field label="Issuer URL" value={issuer} onChange={setIssuer} placeholder="https://example.okta.com" testId="input-oidc-issuer" />
        <Field label="Client ID" value={clientId} onChange={setClientId} placeholder="0oab1c2d3e..." testId="input-oidc-client-id" />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Client secret (write-only; leave blank to keep current{cfg?.hasClientSecret ? " — currently set" : " — not set"})
          </label>
          <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="••••••••" data-testid="input-oidc-secret" />
          <p className="mt-1 text-xs text-slate-500">Public clients (PKCE only, no secret) are supported — leave blank.</p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-oidc">
          {save.isPending ? "Saving…" : "Save OIDC config"}
        </Button>
      </CardContent>
    </Card>
  );
}
