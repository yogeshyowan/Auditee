import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "hipaa-software-compliance-requirements-checklist",
  title: "HIPAA Software Compliance: The 2026 Requirements Checklist",
  description:
    "A practitioner's checklist for HIPAA Security and Privacy Rule compliance in software products — Administrative, Physical, and Technical Safeguards, BAAs, breach notification, and 2024–2025 NPRM updates.",
  date: "2026-03-18",
  author: "Auditee Research",
  tags: ["HIPAA", "Healthcare", "Compliance", "Checklist"],
  readingTimeMin: 10,
  excerpt:
    "HIPAA isn't a checkbox — it's a continuous program. Here's the working checklist we use with healthcare-software customers, broken into Administrative, Physical, and Technical Safeguards, plus 2025 NPRM updates.",
  body: `## Who needs to comply

HIPAA applies to **Covered Entities** (health plans, healthcare clearinghouses, most healthcare providers) and their **Business Associates** (any vendor that creates, receives, maintains, or transmits PHI on behalf of a Covered Entity).

If your software:

- Is sold to hospitals, clinics, payers, pharmacies, or labs **and**
- Stores, transmits, or processes Protected Health Information (PHI)

…then you almost certainly need a Business Associate Agreement (BAA) with each customer and you must comply with the HIPAA Security and Privacy Rules.

## The 2025 NPRM in one paragraph

HHS's December 2024 Notice of Proposed Rulemaking would meaningfully harden the Security Rule for the first time in over a decade — adding mandatory MFA, encryption-at-rest baselines, network segmentation, vulnerability scanning cadences, written security plans, and 24-hour incident notification between Covered Entities and Business Associates. Final rule expected late 2025; assume it's the new baseline and design accordingly.

## Administrative Safeguards (§164.308)

- [ ] **Security Management Process** — formal risk analysis (annual), risk-management plan, sanction policy, information system activity review.
- [ ] **Assigned Security Responsibility** — a named Security Official.
- [ ] **Workforce Security** — authorization, clearance, termination procedures.
- [ ] **Information Access Management** — isolating clearinghouse functions, role-based access, periodic access reviews.
- [ ] **Security Awareness & Training** — onboarding, periodic, and event-driven training. Document attendance.
- [ ] **Security Incident Procedures** — documented runbooks; incident log retained six years.
- [ ] **Contingency Plan** — data-backup plan, disaster-recovery plan, emergency-mode operation plan, testing & revision, applications & data criticality analysis.
- [ ] **Evaluation** — periodic technical and non-technical evaluation against the standard.
- [ ] **Business Associate Contracts** — executed BAA with every downstream subcontractor that touches PHI.

## Physical Safeguards (§164.310)

- [ ] **Facility Access Controls** — contingency operations, facility security plan, access control & validation procedures, maintenance records.
- [ ] **Workstation Use & Security** — written policies for workstation handling of PHI.
- [ ] **Device & Media Controls** — disposal, media re-use, accountability, data backup & storage.

## Technical Safeguards (§164.312)

- [ ] **Access Control** — unique user identification, emergency access procedure, automatic logoff, encryption & decryption.
- [ ] **Audit Controls** — hardware, software, and procedural mechanisms to record and examine activity.
- [ ] **Integrity** — mechanisms to authenticate that ePHI has not been altered or destroyed.
- [ ] **Person or Entity Authentication** — MFA strongly recommended now; mandatory under the 2024 NPRM.
- [ ] **Transmission Security** — integrity controls, end-to-end encryption (TLS 1.2+ minimum, increasingly 1.3).

## Privacy Rule essentials (§164.500)

- [ ] **Notice of Privacy Practices** — drafted, posted, distributed.
- [ ] **Minimum Necessary** — access policies enforce least-privilege to PHI.
- [ ] **Patient rights** — access, amendment, accounting of disclosures, restriction requests, confidential communications.
- [ ] **Authorizations** — for non-treatment, non-payment, non-operations uses of PHI.
- [ ] **De-identification** — Safe Harbor or Expert Determination methodology applied where datasets are shared for research or analytics.

## Breach Notification Rule (§164.400)

- [ ] **Breach risk assessment** — four-factor analysis documented for every suspected incident.
- [ ] **Individual notice** — within 60 days.
- [ ] **HHS notice** — within 60 days for breaches affecting 500+ individuals; annual for smaller incidents.
- [ ] **Media notice** — for breaches affecting 500+ residents of a state or jurisdiction.
- [ ] **Business Associate notification** — to Covered Entity within timelines specified in the BAA (2024 NPRM proposes 24 hours).

## Engineering practices that satisfy multiple rows at once

A few engineering investments dramatically simplify the checklist:

1. **Centralized identity provider with SSO + MFA** — closes Access Control + Authentication boxes.
2. **Comprehensive audit log shipped to immutable storage** — closes Audit Controls + Integrity.
3. **End-to-end encryption with managed keys (KMS)** — closes Transmission Security + a chunk of Access Control.
4. **Infrastructure-as-code with PR review** — produces the change-management evidence auditors love.
5. **Automated vulnerability scanning in CI** — feeds the Security Management Process.
6. **A standards-aware requirements platform** — generates HIPAA-conformant requirements and tests for every feature so you stop accumulating compliance debt with each release.

## Common audit findings (and how to avoid them)

| Finding | Fix |
| --- | --- |
| Risk analysis is years old | Schedule annually; capture in a tracked CAPA |
| Access reviews not performed | Quarterly attestation in your IdP |
| Logs unprotected from tampering | Ship to write-once storage |
| Workforce training stale | Annual + new-hire enrollment automated |
| Vendor BAA missing or stale | Inventory every vendor that touches PHI; renew BAAs annually |
| No incident-response runbook | Author one; tabletop exercise twice per year |
| PHI in non-production environments | Production data must never leave production; use synthetic data |

## How AI helps

A standards-aware AI platform like Auditee:

- Generates HIPAA-conformant requirements for every new feature, citing the relevant rule.
- Generates test cases tied to those requirements.
- Runs HIPAA compliance audits whose findings auto-open CAPAs.
- Produces audit reports in HIPAA-native vocabulary on demand.

When an OCR audit notification arrives, "show me the evidence" is a query, not a fire drill.

[See HIPAA-aware generation →](/automated-compliance) · [Talk to a compliance specialist →](/contact)
`,
};
