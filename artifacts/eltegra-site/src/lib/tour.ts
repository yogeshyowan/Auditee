import { driver } from "driver.js";
import "driver.js/dist/driver.css";

type TourStep = {
  element?: string;
  href?: string;
  title: string;
  description: string;
  /** Tutorial module key — if set, dispatches auditee:tutorial-expand when this step is highlighted */
  module?: string;
};

const STEPS: TourStep[] = [
  {
    title: "Welcome to Auditee",
    description:
      "This 60-second tour walks you through every workflow in the platform — from connecting your first data source to generating an audit-ready report. You can skip anytime.",
  },
  {
    element: '[data-testid="project-switcher"]',
    title: "Your projects",
    description:
      "Switch between projects, see how many sources each has, or spin up a new one. Every workflow on the left is scoped to the project selected here.",
  },
  {
    element: '[data-tour="nav-sources"]',
    href: "/app/sources",
    module: "sources",
    title: "Step 1 — Project Sources",
    description:
      "Start here. Connect IBM DOORS, DOORS Next (OSLC), Jama, Polarion, codeBeamer, Helix RM, Visure, ReqIF, Azure DevOps, Jira, GitHub, Bugzilla or ServiceNow — or upload requirement docs and code archives. Nothing else works until something is connected.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-interview"]',
    href: "/app/interview",
    module: "interview",
    title: "Step 2 — Smart Interview",
    description:
      "AI conducts targeted, standards-aware interviews with stakeholders to elicit missing requirements. Answers feed straight into the requirements graph with full provenance.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-requirements"]',
    href: "/app/requirements",
    module: "requirements",
    title: "Step 3 — Requirements",
    description:
      "Every elicited or imported requirement, tagged with the standards it satisfies and a citation back to its source. Edit, baseline, version and export to your RM tool.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-gaps"]',
    href: "/app/gaps",
    module: "gaps",
    title: "Step 4 — Gap Detection",
    description:
      "Auditee scans your code against the requirements set and surfaces uncovered behaviours, untraced files and missing tests — before an assessor finds them.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-traceability"]',
    href: "/app/traceability",
    module: "traceability",
    title: "Step 5 — Traceability Graph",
    description:
      "Every requirement linked to the file, class or route that implements it, and to the tests, defects and audit findings that touch it. Click any node to walk the chain.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-compliance"]',
    href: "/app/compliance",
    module: "compliance",
    title: "Step 6 — Compliance",
    description:
      "Pick the frameworks you need — ISO 26262, IEC 62304, IEC 61508, IEC 62443, EN 50128, ISO/SAE 21434, ASPICE, SOC 2, ISO 27001, HIPAA, EU AI Act and more — then watch coverage scores update as your project evolves.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-capa"]',
    href: "/app/capa",
    module: "capa",
    title: "Step 7 — CAPA Actions",
    description:
      "Every finding becomes a CAPA with an owner, due date and full evidence chain. Track from open to verified-closed without leaving the platform.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-defects"]',
    href: "/app/defects",
    module: "defects",
    title: "Step 8 — Defects",
    description:
      "Defects pulled from Jira, Bugzilla and ServiceNow, linked back to the requirements they impact and the test cases that should have caught them.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-tests"]',
    href: "/app/tests",
    module: "tests",
    title: "Step 9 — Test Cases",
    description:
      "AI-generated test plans aligned to each standard's verification requirements. Export to TestRail, Xray, qTest or Azure Test Plans in one click.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-reports"]',
    href: "/app/reports",
    module: "reports",
    title: "Step 10 — AI Reports",
    description:
      "One-click generation of canonical artefacts — Safety Plan, HARA, Technical Safety Concept, Cybersecurity Plan, TARA, Security Risk Assessment, audit packets — using your project's actual graph.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-workflows"]',
    href: "/app/workflows",
    module: "workflows",
    title: "Step 11 — Workflows",
    description:
      "Automate handoffs between disciplines: requirements review → safety analysis → code review → test sign-off → audit. Approval chains, gates and notifications.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-analytics"]',
    href: "/app/analytics",
    module: "analytics",
    title: "Step 12 — Analytics",
    description:
      "Roll-up KPIs and trend lines for leadership: audit-readiness score, requirement churn, test coverage, CAPA aging, framework coverage over time.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-recurring-audits"]',
    href: "/app/recurring-audits",
    module: "recurring-audits",
    title: "Step 13 — Recurring Audits",
    description:
      "Schedule continuous compliance scans on every commit or on a cadence — daily, weekly, before each release. Findings flow straight into CAPA.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="nav-dashboard"]',
    href: "/app/dashboard",
    module: "dashboard",
    title: "Step 14 — Dashboard",
    description:
      "Once you have data ingested, this becomes your daily landing page — at-a-glance health across every project, framework and team.<br><span style=\"color:#a78bfa;font-size:11px;\">▶ Expand the tutorial strip above to see a step-by-step walkthrough.</span>",
  },
  {
    element: '[data-tour="ask-auditee"]',
    title: "Ask Auditee — anywhere",
    description:
      "This floating button is on every page. Ask any question about your project's requirements, code, compliance posture or audit history — answers cite back to the graph.",
  },
  {
    title: "You're ready",
    description:
      "Head to Project Sources to connect your first data source. Most teams have a useful audit-readiness score within an hour. You can re-launch this tour anytime from the top-right Take a tour link.",
  },
];

const STORAGE_SEEN = "auditee_tour_seen";
const STORAGE_DONE = "auditee_tour_completed";

function waitForElement(selector: string, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) { resolve(true); return; }
    const start = Date.now();
    const interval = window.setInterval(() => {
      if (document.querySelector(selector)) {
        window.clearInterval(interval); resolve(true);
      } else if (Date.now() - start >= timeoutMs) {
        window.clearInterval(interval); resolve(false);
      }
    }, 50);
  });
}

async function gatedAdvance(
  step: TourStep | undefined,
  navigate: (href: string) => void,
  advance: () => void,
) {
  if (!step) { advance(); return; }
  if (step.href) navigate(step.href);
  if (step.element) {
    await waitForElement(step.element, 1500);
  } else {
    await new Promise((r) => window.setTimeout(r, 60));
  }
  advance();
}

function buildDriver(navigate: (href: string) => void) {
  const d = driver({
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.55,
    smoothScroll: true,
    nextBtnText: "Next \u2192",
    prevBtnText: "\u2190 Back",
    doneBtnText: "Got it",
    progressText: "Step {{current}} of {{total}}",
    steps: STEPS.map((s, i) => ({
      element: s.element,
      popover: {
        title: s.title,
        description: s.description,
        onNextClick: () => {
          void gatedAdvance(STEPS[i + 1], navigate, () => d.moveNext());
        },
        onPrevClick: () => {
          void gatedAdvance(STEPS[i - 1], navigate, () => d.movePrevious());
        },
      },
      onHighlightStarted: s.module
        ? () => {
            // Expand the inline tutorial panel for this step's module
            window.dispatchEvent(new CustomEvent('auditee:tutorial-expand'));
          }
        : undefined,
    })),
    onDestroyed: () => {
      try { localStorage.setItem(STORAGE_DONE, "1"); } catch {}
    },
  });
  return d;
}

export async function startTour(navigate: (href: string) => void) {
  if (typeof window === "undefined") return;
  const first = STEPS[0];
  if (first?.href) navigate(first.href);
  if (first?.element) {
    await waitForElement(first.element, 1500);
  } else {
    await new Promise((r) => window.setTimeout(r, 80));
  }
  const d = buildDriver(navigate);
  d.drive();
}

export function resetTour() {
  try {
    localStorage.removeItem(STORAGE_SEEN);
    localStorage.removeItem(STORAGE_DONE);
  } catch {}
}

export function maybeAutoStartTour(navigate: (href: string) => void) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(STORAGE_DONE) === "1") return;
    if (localStorage.getItem(STORAGE_SEEN) === "1") return;
    localStorage.setItem(STORAGE_SEEN, "1");
  } catch { return; }
  window.setTimeout(() => startTour(navigate), 900);
}
