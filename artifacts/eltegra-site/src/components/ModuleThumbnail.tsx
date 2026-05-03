/**
 * Per-module SVG thumbnail used as the preview "tool snapshot" image on
 * the Demo Videos index card and as the iframe poster on the detail page.
 *
 * Each thumbnail mocks the signature UI of its module so the viewer
 * recognises the tool before pressing play. 16:9 viewBox (640×360).
 */
import { useId } from "react";

type Slug =
  | 'dashboard' | 'sources' | 'interview' | 'requirements' | 'gaps'
  | 'traceability' | 'compliance' | 'capa' | 'defects' | 'tests'
  | 'reports' | 'workflows' | 'analytics' | 'recurring-audits';

type Props = {
  slug: Slug;
  project: string;
  className?: string;
  testId?: string;
};

const PALETTES: Record<Slug, { bg: string; bg2: string; accent: string; ink: string; tag: string }> = {
  dashboard:        { bg: '#0f172a', bg2: '#1e293b', accent: '#a78bfa', ink: '#e2e8f0', tag: 'Dashboard' },
  sources:          { bg: '#0c1424', bg2: '#10243f', accent: '#38bdf8', ink: '#e2e8f0', tag: 'Sources' },
  interview:        { bg: '#1a1230', bg2: '#2d1b4e', accent: '#c084fc', ink: '#f1e9ff', tag: 'Smart Interview' },
  requirements:     { bg: '#0a1f2a', bg2: '#0f3340', accent: '#34d399', ink: '#e0fff5', tag: 'Requirements' },
  gaps:             { bg: '#2a0f12', bg2: '#3f1a1f', accent: '#f87171', ink: '#fee2e2', tag: 'Gap Detection' },
  traceability:     { bg: '#0c1f1a', bg2: '#0f3a30', accent: '#10b981', ink: '#d1fae5', tag: 'Traceability' },
  compliance:       { bg: '#0e1a2e', bg2: '#172a4a', accent: '#60a5fa', ink: '#dbeafe', tag: 'Compliance' },
  capa:             { bg: '#2a1a08', bg2: '#3d2810', accent: '#fb923c', ink: '#ffedd5', tag: 'CAPA' },
  defects:          { bg: '#220c1c', bg2: '#3a1530', accent: '#ec4899', ink: '#fce7f3', tag: 'Defects' },
  tests:            { bg: '#0f1f0c', bg2: '#1a3315', accent: '#84cc16', ink: '#ecfccb', tag: 'Test Cases' },
  reports:          { bg: '#1f1208', bg2: '#33200d', accent: '#fbbf24', ink: '#fef3c7', tag: 'Reports' },
  workflows:        { bg: '#0c1620', bg2: '#152537', accent: '#06b6d4', ink: '#cffafe', tag: 'Workflows' },
  analytics:        { bg: '#1a0f24', bg2: '#2c1a3d', accent: '#a855f7', ink: '#f3e8ff', tag: 'Analytics' },
  'recurring-audits': { bg: '#0a1f24', bg2: '#0f343a', accent: '#22d3ee', ink: '#cffafe', tag: 'Recurring Audits' },
};

function Frame({
  p, children, project, uid,
}: {
  p: typeof PALETTES[Slug];
  children: React.ReactNode;
  project: string;
  uid: string;
}) {
  const bgId = `bggrad-${uid}`;
  const glowId = `glow-${uid}`;
  return (
    <>
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.bg} />
          <stop offset="100%" stopColor={p.bg2} />
        </linearGradient>
        <radialGradient id={glowId} cx="80%" cy="20%" r="60%">
          <stop offset="0%" stopColor={p.accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${bgId})`} />
      <rect width="640" height="360" fill={`url(#${glowId})`} />

      {/* Browser chrome */}
      <rect x="20" y="20" width="600" height="320" rx="14" fill={p.bg} fillOpacity="0.6" stroke={p.accent} strokeOpacity="0.18" />
      <circle cx="40" cy="40" r="4" fill="#ef4444" opacity="0.7" />
      <circle cx="56" cy="40" r="4" fill="#fbbf24" opacity="0.7" />
      <circle cx="72" cy="40" r="4" fill="#22c55e" opacity="0.7" />

      {/* Tag pill — top right */}
      <rect x="480" y="30" width="130" height="22" rx="11" fill={p.accent} fillOpacity="0.18" stroke={p.accent} strokeOpacity="0.5" />
      <text x="545" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11" fontWeight="700" fill={p.accent} textAnchor="middle">
        {p.tag.toUpperCase()}
      </text>

      {/* Project kicker */}
      <text x="40" y="78" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="700" fill={p.accent} letterSpacing="2">
        {project.split(' — ')[0].toUpperCase()}
      </text>
      <text x="40" y="98" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="600" fill={p.ink}>
        {project.split(' — ')[1] ?? ''}
      </text>

      {children}
    </>
  );
}

function Ring({ cx, cy, r, pct, color, label }: { cx: number; cy: number; r: number; pct: number; color: string; label: string }) {
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} stroke="white" strokeOpacity="0.08" strokeWidth="6" fill="none" />
      <circle
        cx={cx} cy={cy} r={r} stroke={color} strokeWidth="6" fill="none"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="700" fill="white">{pct}%</text>
      <text x={cx} y={cy + r + 18} textAnchor="middle" fontSize="9" fontWeight="600" fill="white" opacity="0.75">{label}</text>
    </g>
  );
}

function ListRow({ y, w, label, value, p }: { y: number; w: number; label: string; value: string; p: typeof PALETTES[Slug] }) {
  return (
    <g>
      <rect x="40" y={y} width={w} height="28" rx="6" fill="white" fillOpacity="0.04" stroke={p.accent} strokeOpacity="0.15" />
      <circle cx={56} cy={y + 14} r="4" fill={p.accent} />
      <text x="72" y={y + 18} fontSize="11" fill={p.ink} opacity="0.95">{label}</text>
      <text x={40 + w - 12} y={y + 18} fontSize="10" fontWeight="700" fill={p.accent} textAnchor="end">{value}</text>
    </g>
  );
}

export function ModuleThumbnail({ slug, project, className = '', testId }: Props) {
  const p = PALETTES[slug];
  const uid = useId().replace(/:/g, '');

  let body: React.ReactNode = null;

  switch (slug) {
    case 'dashboard':
      body = (
        <>
          <Ring cx={140} cy={210} r={42} pct={92} color="#a78bfa" label="HIPAA" />
          <Ring cx={250} cy={210} r={42} pct={88} color="#38bdf8" label="DPDP" />
          <Ring cx={360} cy={210} r={42} pct={87} color="#34d399" label="SOC 2" />
          <rect x="450" y="160" width="160" height="50" rx="8" fill="white" fillOpacity="0.04" stroke={p.accent} strokeOpacity="0.2" />
          <text x="465" y="180" fontSize="10" fill={p.ink} opacity="0.7">Open CAPAs</text>
          <text x="465" y="202" fontSize="22" fontWeight="700" fill="#fb923c">2</text>
          <rect x="450" y="220" width="160" height="50" rx="8" fill="white" fillOpacity="0.04" stroke={p.accent} strokeOpacity="0.2" />
          <text x="465" y="240" fontSize="10" fill={p.ink} opacity="0.7">Days to audit</text>
          <text x="465" y="262" fontSize="22" fontWeight="700" fill={p.accent}>14</text>
        </>
      );
      break;

    case 'sources':
      body = (
        <>
          {[
            { l: 'IBM DOORS · 84 reqs', v: 'synced' },
            { l: 'GitHub firmware · 1,840 files', v: 'synced' },
            { l: 'Jira · 47 tickets', v: 'synced' },
            { l: 'Azure DevOps · 23 work items', v: 'synced' },
            { l: '12 clinical PDFs', v: 'parsed' },
          ].map((r, i) => (
            <ListRow key={r.l} y={130 + i * 38} w={560} label={r.l} value={r.v} p={p} />
          ))}
        </>
      );
      break;

    case 'interview':
      body = (
        <>
          {[
            { side: 'l', text: 'What patient population does Aesop enrol?' },
            { side: 'r', text: '500 adults, 18-65, post-op cardiac.' },
            { side: 'l', text: 'How are e-signatures captured?' },
            { side: 'r', text: 'DocuSign with audit trail timestamp.' },
          ].map((b, i) => (
            <g key={i}>
              <rect
                x={b.side === 'l' ? 40 : 320} y={130 + i * 48} width="280" height="36" rx="10"
                fill={b.side === 'l' ? p.accent : 'white'}
                fillOpacity={b.side === 'l' ? 0.18 : 0.06}
                stroke={p.accent} strokeOpacity={b.side === 'l' ? 0.5 : 0.2}
              />
              <text x={b.side === 'l' ? 56 : 336} y={152 + i * 48} fontSize="11" fill={p.ink}>{b.text}</text>
            </g>
          ))}
          <rect x="40" y="320" width="560" height="0" />
        </>
      );
      break;

    case 'requirements':
      body = (
        <>
          {[
            { id: 'BRS-001', label: 'Cell-balancing accuracy ±2 mV', tag: 'ISO 26262 ASIL-C' },
            { id: 'PRD-014', label: 'Thermal runaway response < 100 ms', tag: 'IEC 61508 SIL-3' },
            { id: 'FRD-052', label: 'Secure CAN message authentication', tag: 'ISO 21434' },
            { id: 'PRD-077', label: 'OTA update rollback path', tag: 'UN R155' },
          ].map((r, i) => (
            <g key={r.id}>
              <rect x="40" y={130 + i * 42} width="560" height="32" rx="6" fill="white" fillOpacity="0.04" stroke={p.accent} strokeOpacity="0.2" />
              <text x="56" y={150 + i * 42} fontSize="10" fontWeight="700" fill={p.accent}>{r.id}</text>
              <text x="120" y={150 + i * 42} fontSize="11" fill={p.ink} opacity="0.95">{r.label}</text>
              <rect x={460} y={138 + i * 42} width="130" height="16" rx="8" fill={p.accent} fillOpacity="0.18" />
              <text x={525} y={150 + i * 42} fontSize="9" fontWeight="700" fill={p.accent} textAnchor="middle">{r.tag}</text>
            </g>
          ))}
        </>
      );
      break;

    case 'gaps':
      body = (
        <>
          {[
            { sev: 'CRITICAL', text: 'Missing SOTIF rain test (ISO 21448)', col: '#ef4444' },
            { sev: 'HIGH', text: 'Untraced lane-keep module — 4 files', col: '#f87171' },
            { sev: 'HIGH', text: 'Unmitigated hazard H-018', col: '#f87171' },
            { sev: 'MEDIUM', text: 'Insufficient pedestrian-AEB coverage', col: '#fb923c' },
          ].map((g, i) => (
            <g key={g.text}>
              <rect x="40" y={130 + i * 42} width="560" height="32" rx="6" fill={g.col} fillOpacity="0.10" stroke={g.col} strokeOpacity="0.45" />
              <rect x="40" y={130 + i * 42} width="6" height="32" rx="2" fill={g.col} />
              <text x="60" y={150 + i * 42} fontSize="9" fontWeight="700" fill={g.col}>{g.sev}</text>
              <text x="170" y={150 + i * 42} fontSize="11" fill={p.ink}>{g.text}</text>
              <text x={580} y={150 + i * 42} fontSize="9" fontWeight="700" fill={p.accent} textAnchor="end">→ CAPA</text>
            </g>
          ))}
        </>
      );
      break;

    case 'traceability':
      body = (
        <>
          {/* Req node */}
          <rect x="60" y="200" width="100" height="36" rx="6" fill={p.accent} fillOpacity="0.25" stroke={p.accent} />
          <text x="110" y="222" textAnchor="middle" fontSize="10" fontWeight="700" fill={p.ink}>PRD-014</text>
          {/* Code node */}
          <rect x="220" y="150" width="120" height="36" rx="6" fill="white" fillOpacity="0.06" stroke={p.accent} strokeOpacity="0.4" />
          <text x="280" y="172" textAnchor="middle" fontSize="10" fill={p.ink}>plc_estop.st</text>
          {/* Tests */}
          <rect x="220" y="220" width="120" height="36" rx="6" fill="white" fillOpacity="0.06" stroke="#22c55e" strokeOpacity="0.5" />
          <text x="280" y="242" textAnchor="middle" fontSize="10" fill="#bbf7d0">3 unit tests ✓</text>
          {/* Integration */}
          <rect x="380" y="150" width="120" height="36" rx="6" fill="white" fillOpacity="0.06" stroke="#22c55e" strokeOpacity="0.5" />
          <text x="440" y="172" textAnchor="middle" fontSize="10" fill="#bbf7d0">2 integration ✓</text>
          {/* CAPA */}
          <rect x="380" y="220" width="120" height="36" rx="6" fill="white" fillOpacity="0.06" stroke={p.accent} strokeOpacity="0.4" />
          <text x="440" y="242" textAnchor="middle" fontSize="10" fill={p.ink}>1 CAPA closed</text>
          {/* Coverage badge */}
          <rect x="520" y="180" width="80" height="36" rx="18" fill="#22c55e" fillOpacity="0.20" stroke="#22c55e" />
          <text x="560" y="203" textAnchor="middle" fontSize="13" fontWeight="700" fill="#bbf7d0">91%</text>
          {/* Lines */}
          <line x1="160" y1="218" x2="220" y2="168" stroke={p.accent} strokeOpacity="0.5" strokeWidth="1.5" />
          <line x1="160" y1="218" x2="220" y2="238" stroke={p.accent} strokeOpacity="0.5" strokeWidth="1.5" />
          <line x1="340" y1="168" x2="380" y2="168" stroke={p.accent} strokeOpacity="0.5" strokeWidth="1.5" />
          <line x1="340" y1="238" x2="380" y2="238" stroke={p.accent} strokeOpacity="0.5" strokeWidth="1.5" />
        </>
      );
      break;

    case 'compliance':
      body = (
        <>
          <Ring cx={120} cy={210} r={36} pct={89} color="#a78bfa" label="HIPAA" />
          <Ring cx={220} cy={210} r={36} pct={81} color="#38bdf8" label="HITRUST" />
          <Ring cx={320} cy={210} r={36} pct={76} color="#34d399" label="ISO 27001" />
          <Ring cx={420} cy={210} r={36} pct={88} color="#fb923c" label="SOC 2" />
          <Ring cx={520} cy={210} r={36} pct={92} color="#c084fc" label="FHIR R4" />
          <text x="320" y="320" textAnchor="middle" fontSize="10" fill={p.ink} opacity="0.7">5 frameworks · live · evidence-backed</text>
        </>
      );
      break;

    case 'capa':
      body = (
        <>
          <rect x="40" y="120" width="560" height="200" rx="8" fill="white" fillOpacity="0.04" stroke={p.accent} strokeOpacity="0.25" />
          <text x="56" y="148" fontSize="12" fontWeight="700" fill={p.ink}>CAPA-007 · Field complaint #4419</text>
          <text x="56" y="166" fontSize="10" fill={p.ink} opacity="0.7">Owner: Marcus · Due in 14 days · Root cause: biased training set</text>
          {/* Lifecycle pills */}
          {[
            { l: 'Open', x: 56, c: '#fb923c', done: true },
            { l: 'In Progress', x: 168, c: '#fbbf24', done: true },
            { l: 'In Review', x: 296, c: '#38bdf8', done: false, active: true },
            { l: 'Verified Closed', x: 424, c: '#22c55e', done: false },
          ].map((s) => (
            <g key={s.l}>
              <rect x={s.x} y="200" width="110" height="28" rx="14" fill={s.c} fillOpacity={s.done ? 0.30 : (s.active ? 0.18 : 0.08)} stroke={s.c} strokeOpacity={s.done || s.active ? 0.7 : 0.3} />
              <text x={s.x + 55} y="218" textAnchor="middle" fontSize="10" fontWeight="700" fill={s.c}>{s.l}</text>
            </g>
          ))}
          <text x="56" y="262" fontSize="10" fill={p.ink} opacity="0.7">Evidence: model_card_v3.md, regression_run_2026-04-30.json</text>
          <text x="56" y="282" fontSize="10" fill={p.ink} opacity="0.7">Verifier: QA Lead — pending sign-off</text>
        </>
      );
      break;

    case 'defects':
      body = (
        <>
          {[
            { id: 'DEF-219', t: 'UPI mandate creation fails on retry', src: 'Jira', sev: 'P1', col: '#ef4444' },
            { id: 'DEF-216', t: 'Statement PDF truncates last page', src: 'Bugzilla', sev: 'P2', col: '#f87171' },
            { id: 'DEF-210', t: 'Reconciliation mismatch on FX trades', src: 'ServiceNow', sev: 'P2', col: '#f87171' },
            { id: 'DEF-204', t: 'Card-tokenisation timeout > 5s', src: 'Jira', sev: 'P3', col: '#fb923c' },
          ].map((d, i) => (
            <g key={d.id}>
              <rect x="40" y={130 + i * 38} width="560" height="28" rx="6" fill="white" fillOpacity="0.04" stroke={p.accent} strokeOpacity="0.18" />
              <rect x="48" y={138 + i * 38} width="36" height="14" rx="3" fill={d.col} fillOpacity="0.25" />
              <text x="66" y={148 + i * 38} fontSize="9" fontWeight="700" fill={d.col} textAnchor="middle">{d.sev}</text>
              <text x="98" y={148 + i * 38} fontSize="10" fontWeight="700" fill={p.accent}>{d.id}</text>
              <text x="170" y={148 + i * 38} fontSize="10" fill={p.ink}>{d.t}</text>
              <text x={580} y={148 + i * 38} fontSize="9" fill={p.ink} opacity="0.6" textAnchor="end">{d.src}</text>
            </g>
          ))}
        </>
      );
      break;

    case 'tests':
      body = (
        <>
          {/* Test grid */}
          {Array.from({ length: 48 }).map((_, i) => {
            const cx = 60 + (i % 16) * 32;
            const cy = 140 + Math.floor(i / 16) * 32;
            const passed = i % 13 !== 0;
            return (
              <rect
                key={i}
                x={cx} y={cy} width="22" height="22" rx="4"
                fill={passed ? '#84cc16' : '#f87171'}
                fillOpacity={passed ? 0.55 : 0.7}
              />
            );
          })}
          <text x="40" y="260" fontSize="10" fill={p.ink} opacity="0.7">312 generated · 308 passing · 4 flagged</text>
          <rect x="40" y="280" width="560" height="36" rx="8" fill={p.accent} fillOpacity="0.15" stroke={p.accent} strokeOpacity="0.4" />
          <text x="56" y="303" fontSize="11" fontWeight="700" fill={p.ink}>↗ Push to TestRail · Xray · qTest · Azure Test Plans</text>
        </>
      );
      break;

    case 'reports':
      body = (
        <>
          {/* Document */}
          <rect x="60" y="120" width="240" height="200" rx="8" fill="white" fillOpacity="0.92" />
          <rect x="80" y="140" width="200" height="6" rx="3" fill="#1e293b" />
          <rect x="80" y="156" width="180" height="3" rx="1.5" fill="#64748b" />
          <rect x="80" y="166" width="200" height="3" rx="1.5" fill="#64748b" />
          <rect x="80" y="176" width="160" height="3" rx="1.5" fill="#64748b" />
          <rect x="80" y="196" width="200" height="50" rx="3" fill="#dbeafe" />
          <rect x="80" y="256" width="140" height="3" rx="1.5" fill="#64748b" />
          <rect x="80" y="266" width="200" height="3" rx="1.5" fill="#64748b" />
          <rect x="80" y="276" width="180" height="3" rx="1.5" fill="#64748b" />
          <rect x="80" y="286" width="200" height="3" rx="1.5" fill="#64748b" />
          <rect x="80" y="296" width="120" height="3" rx="1.5" fill="#64748b" />
          {/* Stat block */}
          <rect x="340" y="140" width="260" height="80" rx="8" fill={p.accent} fillOpacity="0.15" stroke={p.accent} strokeOpacity="0.4" />
          <text x="470" y="180" textAnchor="middle" fontSize="36" fontWeight="700" fill={p.accent}>247</text>
          <text x="470" y="205" textAnchor="middle" fontSize="11" fill={p.ink}>pages generated · 4 minutes</text>
          {/* Pick-list */}
          <rect x="340" y="234" width="260" height="86" rx="8" fill="white" fillOpacity="0.06" stroke={p.accent} strokeOpacity="0.2" />
          <text x="356" y="254" fontSize="10" fontWeight="700" fill={p.ink}>Choose audit packet:</text>
          <text x="356" y="272" fontSize="10" fill={p.ink} opacity="0.85">• CFTC Reg AT</text>
          <text x="356" y="288" fontSize="10" fill={p.ink} opacity="0.85">• MiFID II RTS 6</text>
          <text x="356" y="304" fontSize="10" fill={p.accent} fontWeight="700">✓ SOC 2 Type II</text>
        </>
      );
      break;

    case 'workflows':
      body = (
        <>
          {/* Pipeline */}
          {[
            { l: 'PR Merged', c: '#22c55e' },
            { l: 'Reqs Linked', c: '#22c55e' },
            { l: 'Tests Pass', c: '#fbbf24' },
            { l: 'Security Approved', c: '#475569' },
            { l: 'Release', c: '#475569' },
          ].map((s, i) => (
            <g key={s.l}>
              <circle cx={80 + i * 120} cy="220" r="22" fill={s.c} fillOpacity="0.25" stroke={s.c} strokeWidth="2" />
              <text x={80 + i * 120} y="226" textAnchor="middle" fontSize="14" fontWeight="700" fill={s.c}>{i + 1}</text>
              <text x={80 + i * 120} y="265" textAnchor="middle" fontSize="9" fontWeight="600" fill={p.ink}>{s.l}</text>
              {i < 4 && <line x1={102 + i * 120} y1="220" x2={158 + i * 120} y2="220" stroke={p.accent} strokeOpacity="0.4" strokeWidth="2" />}
            </g>
          ))}
          <rect x="40" y="290" width="560" height="34" rx="6" fill={p.accent} fillOpacity="0.12" stroke={p.accent} strokeOpacity="0.3" />
          <text x="56" y="312" fontSize="10" fill={p.ink}>PR-481 · blocked at gate 3 — coverage 78%, target 85%</text>
        </>
      );
      break;

    case 'analytics':
      body = (
        <>
          {/* KPI tiles */}
          {[
            { l: 'Audit Readiness', v: '84%', col: '#a855f7' },
            { l: 'Test Coverage', v: '92%', col: '#34d399' },
            { l: 'CAPA Closure', v: '100%', col: '#fb923c' },
            { l: 'Traceability', v: '88%', col: '#38bdf8' },
          ].map((k, i) => (
            <g key={k.l}>
              <rect x={40 + i * 145} y="130" width="135" height="80" rx="8" fill="white" fillOpacity="0.05" stroke={k.col} strokeOpacity="0.4" />
              <text x={50 + i * 145} y="150" fontSize="9" fontWeight="700" fill={p.ink} opacity="0.7">{k.l}</text>
              <text x={50 + i * 145} y="190" fontSize="26" fontWeight="700" fill={k.col}>{k.v}</text>
            </g>
          ))}
          {/* Sparkline area */}
          <rect x="40" y="230" width="560" height="90" rx="8" fill="white" fillOpacity="0.04" stroke={p.accent} strokeOpacity="0.25" />
          <polyline
            points="60,300 130,290 200,275 270,278 340,260 410,245 480,235 550,222"
            fill="none" stroke={p.accent} strokeWidth="2.5"
          />
          <polyline
            points="60,300 130,290 200,275 270,278 340,260 410,245 480,235 550,222 550,310 60,310"
            fill={p.accent} fillOpacity="0.18" stroke="none"
          />
          {[60, 130, 200, 270, 340, 410, 480, 550].map((cx, i) => (
            <circle key={i} cx={cx} cy={[300, 290, 275, 278, 260, 245, 235, 222][i]} r="3" fill={p.accent} />
          ))}
          <text x="56" y="248" fontSize="9" fontWeight="700" fill={p.ink} opacity="0.7">7-WEEK READINESS · +6%</text>
        </>
      );
      break;

    case 'recurring-audits':
      body = (
        <>
          {[
            { name: 'VASP screening', cad: 'Daily', next: 'Tomorrow 09:00', status: 'Scheduled', col: '#38bdf8' },
            { name: 'Travel-rule review', cad: 'Weekly', next: 'Mon 10:00', status: 'Running', col: '#fbbf24' },
            { name: 'SOC 2 internal audit', cad: 'Monthly', next: 'Jun 1', status: 'Completed', col: '#22c55e' },
          ].map((a, i) => (
            <g key={a.name}>
              <rect x="40" y={130 + i * 56} width="560" height="46" rx="8" fill="white" fillOpacity="0.05" stroke={a.col} strokeOpacity="0.4" />
              <circle cx="64" cy={153 + i * 56} r="6" fill={a.col} />
              <text x="80" y={150 + i * 56} fontSize="11" fontWeight="700" fill={p.ink}>{a.name}</text>
              <text x="80" y={167 + i * 56} fontSize="10" fill={p.ink} opacity="0.7">{a.cad} · next {a.next}</text>
              <rect x={490} y={144 + i * 56} width="100" height="20" rx="10" fill={a.col} fillOpacity="0.20" />
              <text x={540} y={158 + i * 56} fontSize="10" fontWeight="700" fill={a.col} textAnchor="middle">{a.status}</text>
            </g>
          ))}
          <text x="40" y="320" fontSize="10" fill={p.ink} opacity="0.7">9 consecutive monthly audits · 0 overdue CAPAs</text>
        </>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 640 360"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`${p.tag} preview for ${project}`}
      data-testid={testId}
    >
      <Frame p={p} project={project} uid={uid}>{body}</Frame>
    </svg>
  );
}
