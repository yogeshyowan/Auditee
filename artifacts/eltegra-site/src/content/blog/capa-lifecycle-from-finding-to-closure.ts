import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "capa-lifecycle-from-finding-to-closure",
  title: "The CAPA Lifecycle: From Audit Finding to Verified Closure",
  description:
    "A practical CAPA workflow that satisfies ISO 9001, ISO 13485, FDA 21 CFR 820, IATF 16949, AS9100 and SOC 2 — with realistic timelines and the documentation auditors expect.",
  date: "2026-03-21",
  author: "Auditee Research",
  tags: ["CAPA", "Quality Management", "Compliance", "ISO 9001", "FDA"],
  readingTimeMin: 10,
  excerpt:
    "Corrective and Preventive Actions are the immune system of a regulated organisation. Done well, they kill recurring defects forever. Done poorly, they bury teams in paperwork and still let issues recur.",
  body: `## What CAPA is — and what it isn't

A **Corrective Action** addresses the *cause* of a known nonconformity so it does not recur. A **Preventive Action** addresses the *cause of a potential* nonconformity that has not yet occurred.

What CAPA is *not*:

- **Containment.** Recalling a batch is containment, not corrective.
- **A bug fix.** Patching the symptom is not addressing the cause.
- **A meeting.** "We discussed it" is not a corrective action.

The standards that mandate CAPA — ISO 9001 §10.2, ISO 13485 §8.5, FDA 21 CFR 820.100, IATF 16949 §10.2, AS9100 §10.2, SOC 2 CC4.2 — all require *evidence of effectiveness*, not just evidence of activity.

## The seven-stage lifecycle

Every defensible CAPA follows essentially the same arc:

1. **Identify** — a finding from an audit, complaint, defect, or trend.
2. **Investigate** — root-cause analysis (5 Whys, Fishbone, FMEA).
3. **Plan** — corrective and/or preventive actions with owners and dates.
4. **Implement** — execute the planned actions.
5. **Verify** — prove the action was carried out.
6. **Validate effectiveness** — prove it actually prevented recurrence over a defined window.
7. **Close** — sign off, archive evidence, update the trend register.

Skipping stage 6 is the most common audit failure: you implemented the action, but you never confirmed it worked.

## Realistic SLAs by severity

Tie due dates to severity at the moment of opening:

| Severity | Investigation due | Implementation due | Effectiveness check |
| --- | --- | --- | --- |
| **Critical** (recall, regulatory exposure) | 3 days | 14 days | 90 days |
| **Major** | 7 days | 30 days | 180 days |
| **Minor** | 30 days | 90 days | 1 audit cycle |

Tracking these openly — and pinging the owner when they slip — is the single biggest hygiene improvement most QMS programs can make.

## Root-cause techniques that hold up

Auditors look for evidence the team *understood* the cause, not just guessed at it:

- **5 Whys** — start at the symptom, ask "why" five times, until the answer is a process or system, not a person.
- **Fishbone (Ishikawa)** — categorise potential causes (Method, Machine, Material, Manpower, Measurement, Environment).
- **Fault-tree analysis** — for safety-critical defects.
- **DMAIC** — for chronic defects with statistical signal.
- **A3 report** — single-page narrative covering background, current state, root cause, countermeasures, follow-up.

Whichever technique you use, *write down the chain of reasoning*. "Cause: human error" is not an acceptable conclusion in any modern audit.

## Linking CAPA to the rest of the system

A CAPA is not an island. It must link to:

- The **finding** that triggered it (audit observation, defect, complaint).
- The **requirement** or **process step** that was violated.
- The **standard clause** the violation breached.
- The **risk** in the risk register that was realised (or that is now reduced).
- Any **document changes** required (procedure updates, work instructions).
- **Training records** if the CAPA includes a training action.
- The **test or measurement** used to validate effectiveness.

When auditors pull a single CAPA and trace these links, the answer must be one click each.

## What "effectiveness" really requires

An effectiveness check is not "did we do the thing." It is "did doing the thing eliminate the recurrence."

That requires:

- A **defined observation window** (e.g. "no recurrence over 90 days and 12 production releases").
- A **measurable signal** (defect rate, escape rate, complaint count, audit observation count).
- A **comparison** to the baseline before the corrective action.
- A **statistical or narrative argument** that the change was meaningful.

If you cannot describe what evidence will close the CAPA at the moment you open it, you have a wish, not an action plan.

## Where AI-native quality systems help

A connected platform turns CAPA from a manual ticket queue into a closed loop:

- **Auto-open from defects.** A defect violating a Class C requirement opens a CAPA with the right standard clause attached.
- **Auto-open from audit findings.** Internal-audit observations classified to a clause open a CAPA in the same workflow.
- **Owner & due-date defaults** by severity and standard — no more "we'll figure that out later".
- **Effectiveness window timers** — the CAPA does not auto-close; the platform pings the owner at day 90 to record evidence.
- **Trend boards** — recurring root causes (e.g. "validation against ISO 13485 §7.3.3" appears on six CAPAs) surface the systemic issue.
- **Audit packets** — one click renders the CAPA register, RCA chain, evidence, and effectiveness record.

The teams that do this well stop firefighting. The teams that do not, ship the same defect again next quarter and call the auditor unfair.

## A realistic 30-day rollout

If your CAPA process today lives in spreadsheets and email:

1. **Days 0–5** — Standardise the CAPA form (one page; severity, owner, dates, RCA, planned actions, effectiveness criteria).
2. **Days 5–10** — Migrate open CAPAs into the platform; assign realistic SLAs.
3. **Days 10–20** — Wire incoming sources (Jira severity-1 bugs, internal-audit findings, customer complaints).
4. **Days 20–25** — Run the first weekly CAPA stand-up; surface aging items.
5. **Days 25–30** — Publish trend dashboard to the leadership team. Watch what happens.

[See the CAPA workflow on the Vega claims-intelligence demo](/demo-videos/capa) — open through verified-closed in eleven days.
`,
};
