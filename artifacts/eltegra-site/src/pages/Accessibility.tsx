import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Accessibility as A11yIcon } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Accessibility() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Accessibility Statement — Auditee"
        description="Auditee's commitment to WCAG 2.2 AA, ARIA roles, keyboard-only navigation, screen-reader compatibility, and a documented remediation backlog. EN 301 549 and Section 508 conformance roadmap."
        path="/accessibility"
        keywords={["Auditee accessibility", "WCAG 2.2 AA", "Section 508", "EN 301 549", "accessible SaaS", "a11y statement"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/security" className="text-sm text-slate-700 hover:text-primary">Security</Link>
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust center</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <A11yIcon className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Accessibility statement</h1>
          <p className="text-lg text-slate-700">Last updated: 1 May 2026</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Our commitment</h2>
          <p>Auditee is built for regulated industries — many of which are themselves bound by accessibility law (Section 508 in the US, EN 301 549 in the EU, the Rights of Persons with Disabilities Act 2016 in India). We treat accessibility as a first-class engineering concern, not a checkbox.</p>

          <h2>Conformance target</h2>
          <ul>
            <li><strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong> — partially conformant today, full conformance targeted by Q4 2026.</li>
            <li><strong>EN 301 549 v3.2.1</strong> — clauses 9, 10 and 11 in scope (web, non-web documents, software).</li>
            <li><strong>US Section 508 (Revised, 2018)</strong> — VPAT (Voluntary Product Accessibility Template) available on request from <a href="mailto:accessibility@auditee.site">accessibility@auditee.site</a>.</li>
          </ul>

          <h2>What works today</h2>
          <ul>
            <li>All marketing pages and the customer-facing dashboard support keyboard-only navigation with visible focus indicators.</li>
            <li>Semantic HTML throughout, with ARIA roles on custom widgets (combo-boxes, tab-panels, modals, data grids).</li>
            <li>Screen-reader testing on each release with NVDA, JAWS and VoiceOver. Last full pass: April 2026.</li>
            <li>Colour palette meets a 4.5:1 contrast ratio for body text and 3:1 for large text — verified per release.</li>
            <li>Forms expose explicit labels and inline error messages associated via <code>aria-describedby</code>.</li>
            <li>No essential functionality depends on hover, drag-only gestures, or motion sensing.</li>
            <li>The site honours <code>prefers-reduced-motion</code>.</li>
          </ul>

          <h2>Known gaps (open remediation backlog)</h2>
          <ul>
            <li>Some data-grid keyboard shortcuts in <code>/app/requirements</code> are not yet documented in-product. Targeted: Q3 2026.</li>
            <li>The whiteboard / canvas view has limited screen-reader semantics. We're rebuilding this on an accessible primitive — targeted Q4 2026.</li>
            <li>A handful of icon-only buttons need expanded <code>aria-label</code> coverage. Tracked under issue <code>A11Y-114</code>.</li>
            <li>PDF exports are not yet WCAG-tagged; a tagged-PDF mode is under active development.</li>
          </ul>

          <h2>Assistive technology we test against</h2>
          <ul>
            <li>Screen readers: NVDA on Firefox/Chrome (Windows), JAWS on Chrome (Windows), VoiceOver on Safari (macOS &amp; iOS), TalkBack on Chrome (Android).</li>
            <li>Magnifiers: ZoomText, macOS Zoom.</li>
            <li>Voice control: Dragon, Voice Control on macOS, Voice Access on Android.</li>
          </ul>

          <h2>Reporting an accessibility issue</h2>
          <p>If you hit a barrier we haven't documented, please tell us. We commit to:</p>
          <ul>
            <li>Acknowledge within <strong>1 business day</strong>.</li>
            <li>Triage and respond with a fix plan within <strong>5 business days</strong>.</li>
            <li>Prioritise blockers ahead of feature work.</li>
          </ul>
          <p>Email <a href="mailto:accessibility@auditee.site">accessibility@auditee.site</a> with the page URL, what you tried, what happened, and what assistive tech / browser combination you were using.</p>

          <h2>Contact</h2>
          <p>Qwikstuffs Pvt. Ltd. · Chennai 600077, Tamil Nadu, India · <a href="mailto:accessibility@auditee.site">accessibility@auditee.site</a> · +91-83100-42593</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Hit an accessibility barrier?</h2>
          <p className="text-slate-300 mb-6">A human reads every report. Acknowledgment within one business day; fix plan within five.</p>
          <a href="mailto:accessibility@auditee.site">
            <Button size="lg" className="rounded-full" data-testid="a11y-contact-cta">Email accessibility@auditee.site<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </a>
        </div>
      </section>
    </div>
  );
}
