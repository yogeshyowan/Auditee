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
          <TabsTrigger value="scim" data-testid="tab-scim"><ShieldCheck className="mr-1 h-4 w-4" /> SCIM</TabsTrigger>
          <TabsTrigger value="siem" data-testid="tab-siem"><Webhook className="mr-1 h-4 w-4" /> SIEM</TabsTrigger>
          <TabsTrigger value="llm" data-testid="tab-llm"><BrainCircuit className="mr-1 h-4 w-4" /> BYO-LLM</TabsTrigger>
          <TabsTrigger value="mfa" data-testid="tab-mfa"><ShieldCheck className="mr-1 h-4 w-4" /> MFA</TabsTrigger>
          <TabsTrigger value="region" data-testid="tab-region"><Globe2 className="mr-1 h-4 w-4" /> Data Region</TabsTrigger>
          <TabsTrigger value="cmk" data-testid="tab-cmk"><LockKeyhole className="mr-1 h-4 w-4" /> Encryption Key</TabsTrigger>
        </TabsList>

        <TabsContent value="saml"><SamlPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="scim"><ScimPanel getToken={getToken} toast={toast} /></TabsContent>
        <TabsContent value="siem"><SiemPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="llm"><LlmPanel getToken={getToken} toast={toast} /></TabsContent>
        <TabsContent value="mfa"><MfaPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="region"><RegionPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
        <TabsContent value="cmk"><CmkPanel ws={ws} getToken={getToken} toast={toast} onSaved={refresh} /></TabsContent>
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

  const save = useMutation({
    mutationFn: async () => authedFetch("/workspace/siem", await getToken(), {
      method: "POST", body: JSON.stringify({ url: url.trim() || null, secret: secret.trim() || null }),
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
