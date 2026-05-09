import { motion } from 'framer-motion';
import type { ModuleKey } from '@/lib/demoUseCases';

export type AspiceProcess = {
  id: string;
  family: string;
  accent: string;
};

export const ASPICE_FOR_MODULE: Record<ModuleKey, AspiceProcess> = {
  dashboard:           { id: 'MAN.3',  family: 'Project Management',           accent: '#a78bfa' },
  sources:             { id: 'ENG.1',  family: 'Requirements Elicitation',    accent: '#38bdf8' },
  interview:           { id: 'ENG.1',  family: 'Requirements Elicitation',    accent: '#c084fc' },
  requirements:        { id: 'ENG.2',  family: 'System Requirements Analysis',accent: '#34d399' },
  gaps:                { id: 'ENG.2',  family: 'Requirements Gap Analysis',   accent: '#f87171' },
  defects:             { id: 'SUP.9',  family: 'Problem Resolution Mgmt.',    accent: '#fb923c' },
  compliance:          { id: 'SUP.10', family: 'Change & Compliance Audit',   accent: '#34d399' },
  traceability:        { id: 'ENG.5',  family: 'Bidirectional Traceability',  accent: '#38bdf8' },
  capa:                { id: 'SUP.10', family: 'CAPA — Corrective Action',    accent: '#34d399' },
  workflows:           { id: 'MAN.3',  family: 'Workflow Orchestration',      accent: '#a78bfa' },
  pdlc:                { id: 'MAN.3',  family: 'PDLC Progress Monitoring',    accent: '#a78bfa' },
  tests:               { id: 'SWE.4',  family: 'Software Unit Verification',  accent: '#34d399' },
  reports:             { id: 'SUP.7',  family: 'Documentation & Reporting',   accent: '#facc15' },
  'recurring-audits':  { id: 'SUP.10', family: 'Recurring Compliance Audits', accent: '#fb923c' },
  analytics:           { id: 'MAN.6',  family: 'Measurement & Analytics',     accent: '#38bdf8' },
  legacy:              { id: 'REU.2',  family: 'Reuse — Legacy Modernisation',accent: '#a78bfa' },
  ask:                 { id: 'SUP.8',  family: 'Configuration Knowledge',     accent: '#c084fc' },
};

export function AspiceHookScene() {
  return (
    <motion.div
      key="aspice-hook"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8vw]"
      style={{ background: 'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #0b0f1a 70%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-[1.5vw] uppercase tracking-[0.4em] mb-6"
        style={{ color: '#38bdf8' }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      >
        Automotive SPICE 4.0 · End-to-end walkthrough
      </motion.div>
      <motion.div
        className="text-[5vw] font-black leading-[1.05] text-white max-w-[90%]"
        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 18, delay: 0.4 }}
      >
        From a one-line brief to a signed Automotive SPICE audit packet.
      </motion.div>
      <motion.div
        className="mt-8 text-[2vw] text-amber-300 font-semibold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        Apollo — EV Battery Management System · ASIL-C · ASPICE CL3 target
      </motion.div>
      <motion.div
        className="mt-12 grid grid-cols-4 gap-4 text-left max-w-[78%]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}
      >
        {[
          { label: 'ENG.1', text: 'Brief → Requirements' },
          { label: 'ENG.5', text: 'Live Traceability' },
          { label: 'SUP.10', text: 'Audit + CAPA' },
          { label: 'MAN.3', text: 'PDLC + Workflows' },
        ].map((b) => (
          <div
            key={b.label}
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: 'rgba(167,139,250,0.35)', background: 'rgba(15,12,40,0.6)' }}
          >
            <div className="text-[1vw] font-bold text-violet-300 tracking-wider">{b.label}</div>
            <div className="text-[1.4vw] text-white/85 mt-1">{b.text}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export function AspiceChapterTitle({
  index, total, slug, stepLabel, stepTitle,
}: {
  index: number; total: number; slug: ModuleKey;
  stepLabel: string; stepTitle: string;
}) {
  const proc = ASPICE_FOR_MODULE[slug];
  return (
    <motion.div
      key={`aspice-chapter-${index}-${slug}`}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8vw]"
      style={{ background: `radial-gradient(circle at 50% 50%, ${proc.accent}33 0%, #0b0f1a 70%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-[1.4vw] uppercase tracking-[0.4em] mb-4"
        style={{ color: proc.accent }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      >
        Step {String(index).padStart(2, '0')} of {String(total).padStart(2, '0')}
      </motion.div>

      <motion.div
        className="inline-flex items-center gap-3 rounded-full px-5 py-2 mb-6"
        style={{
          background: 'rgba(15,12,40,0.7)',
          border: `1px solid ${proc.accent}66`,
        }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <span className="text-[1.3vw] font-black tracking-widest" style={{ color: proc.accent }}>
          ASPICE · {proc.id}
        </span>
        <span className="text-[1.1vw] text-white/70">{proc.family}</span>
      </motion.div>

      <motion.div
        className="text-[5vw] font-black leading-[1.05] text-white max-w-[80%]"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {stepTitle}
      </motion.div>
      <motion.div
        className="mt-5 text-[2vw] text-white/75 max-w-[70%]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        {stepLabel}
      </motion.div>
    </motion.div>
  );
}

export function EnterpriseScene() {
  const cards = [
    {
      title: 'Single Sign-On (SSO)',
      sub: 'SAML 2.0 · OIDC · SCIM provisioning',
      detail: 'Okta, Azure AD, Google Workspace. JIT user creation, group → role mapping, enforced MFA inherited from the IdP.',
      color: '#a78bfa',
    },
    {
      title: 'RBAC + ABAC',
      sub: 'Workspace · Project · Resource scopes',
      detail: 'Owner, Admin, Auditor, Engineer, Viewer. Per-project role overrides. Attribute rules for region, classification, framework.',
      color: '#38bdf8',
    },
    {
      title: 'Append-only Audit Log',
      sub: 'Hash-chained · WORM-export to S3',
      detail: 'Every requirement edit, CAPA transition, gate sign-off captured with actor, IP, timestamp and SHA-256 integrity hash.',
      color: '#34d399',
    },
    {
      title: 'Security Events',
      sub: 'SIEM stream · Splunk · Datadog',
      detail: 'Failed logins, role escalations, anomalous exports streamed in real time. Native connectors for Splunk HEC and Datadog.',
      color: '#fb923c',
    },
  ];

  return (
    <motion.div
      key="aspice-enterprise"
      className="absolute inset-0 flex flex-col items-center justify-center px-[6vw]"
      style={{ background: 'radial-gradient(circle at 50% 30%, #134e4a 0%, #0b0f1a 70%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-[1.4vw] uppercase tracking-[0.4em] mb-3"
        style={{ color: '#34d399' }}
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      >
        Enterprise readiness
      </motion.div>
      <motion.div
        className="text-[4.5vw] font-black text-white text-center leading-tight"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        SSO, RBAC and audit logs — out of the box.
      </motion.div>

      <div className="mt-10 grid grid-cols-2 gap-5 max-w-[78%]">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            className="rounded-2xl border p-5"
            style={{
              borderColor: `${c.color}55`,
              background: 'linear-gradient(135deg, rgba(15,12,40,0.85) 0%, rgba(20,20,50,0.9) 100%)',
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.25 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[1.6vw] font-bold text-white">{c.title}</div>
              <span
                className="text-[0.85vw] font-black tracking-widest px-2 py-0.5 rounded-md"
                style={{ background: `${c.color}22`, color: c.color }}
              >
                ENTERPRISE
              </span>
            </div>
            <div className="mt-1 text-[1vw] uppercase tracking-widest" style={{ color: c.color }}>
              {c.sub}
            </div>
            <div className="mt-3 text-[1.05vw] text-white/80 leading-snug">{c.detail}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function AspiceClosure() {
  return (
    <motion.div
      key="aspice-closure"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8vw]"
      style={{ background: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0b0f1a 70%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-[1.4vw] uppercase tracking-[0.4em] mb-4 text-emerald-300"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        Apollo · ASPICE CL3 · Audit-ready
      </motion.div>
      <motion.div
        className="text-[5vw] font-black text-white leading-tight max-w-[85%]"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        Brief → 192 reqs → traced code → signed audit packet.
      </motion.div>
      <motion.div
        className="mt-5 text-[2vw] text-white/75 max-w-[70%]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        Every step you just watched is live in the product today.
      </motion.div>
      <motion.a
        href="https://auditee.site"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex items-center gap-3 rounded-full px-12 py-6 text-[2.4vw] font-black text-slate-950 shadow-2xl"
        style={{ background: 'linear-gradient(90deg, #a78bfa, #38bdf8)' }}
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, delay: 1.4 }}
      >
        Start your ASPICE walkthrough →
      </motion.a>
      <motion.div
        className="mt-6 text-[1.4vw] text-white/65"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
      >
        auditee.site · book a 30-minute live demo on your own project
      </motion.div>
    </motion.div>
  );
}
