import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Ban, Bug, Mail } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Aup() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Acceptable Use Policy (AUP) — Auditee"
        description="What you may and may not do with the Auditee platform. Covers prohibited content, abuse, security testing, automated access, and the consequences of violation."
        path="/aup"
        keywords={["Auditee AUP", "Acceptable Use Policy", "SaaS AUP", "abuse policy", "responsible disclosure"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/terms-of-service" className="text-sm text-slate-700 hover:text-primary">Terms</Link>
            <Link href="/security" className="text-sm text-slate-700 hover:text-primary">Security</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <ShieldAlert className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Acceptable Use Policy</h1>
          <p className="text-slate-700">Effective 03 May 2026. This AUP supplements and is incorporated into the <Link href="/terms-of-service" className="text-primary underline">Terms of Service</Link>.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <p>
            We built Auditee to help engineering and compliance teams work in good faith. The rules below exist to protect customers, end-users and the integrity of the Service. Violations can result in suspension or termination of your workspace.
          </p>

          <h2>1. You may not use Auditee to</h2>
          <ul>
            <li>Engage in unlawful activity, including infringing on intellectual property, trade secrets, privacy or export-control laws.</li>
            <li>Upload, store or distribute content that is defamatory, harassing, hateful, sexually explicit (especially involving minors), or that incites violence.</li>
            <li>Process payment-card data (PAN), unencrypted protected health information, or government-classified material outside an Enterprise plan with an executed BAA / addendum.</li>
            <li>Generate, store or distribute malware, ransomware, phishing kits, or instructions to manufacture weapons.</li>
            <li>Misrepresent regulatory evidence, falsify audit trails, or use AI-generated content as authoritative compliance evidence without the human review the regulation requires.</li>
            <li>Resell or sublicense the Service in a way that competes with Auditee, or scrape the Service to train competing AI models.</li>
          </ul>

          <h2>2. Security &amp; integrity</h2>
          <ul>
            <li>Do not probe, scan or test the vulnerability of the Service except under our coordinated <Link href="/security#disclosure" className="text-primary underline">responsible-disclosure programme</Link>.</li>
            <li>Do not interfere with or disrupt the Service, the underlying network, or other customers' access — including by submitting unreasonable workloads.</li>
            <li>Do not bypass authentication, rate limits, billing controls, or any access mechanism.</li>
            <li>Do not impersonate another person or entity, or misrepresent affiliation with any organisation.</li>
          </ul>

          <h2>3. Automated access &amp; AI training</h2>
          <ul>
            <li>API and headless-browser access is permitted within published rate limits and under valid API keys for your workspace.</li>
            <li>You may not use Auditee outputs to train, fine-tune or evaluate models that compete with Auditee's AI features.</li>
            <li>Bot, crawler and headless-browser identification must use a unique, attributable User-Agent so we can contact you about issues.</li>
          </ul>

          <h2>4. Bulk &amp; high-volume usage</h2>
          <p>
            "Unlimited" plan attributes are subject to fair-use thresholds documented in the in-app billing console. We will reach out before throttling, and we never silently downgrade results to game a fair-use cap.
          </p>

          <h2>5. Reporting abuse</h2>
          <p className="not-prose flex items-center gap-2 my-3 text-slate-800"><Bug className="h-5 w-5 text-primary" /> Security vulnerabilities → <a href="mailto:security@auditee.site" className="text-primary underline">security@auditee.site</a></p>
          <p className="not-prose flex items-center gap-2 my-3 text-slate-800"><Ban className="h-5 w-5 text-primary" /> Abuse, illegal content or spam → <a href="mailto:abuse@auditee.site" className="text-primary underline">abuse@auditee.site</a></p>
          <p className="not-prose flex items-center gap-2 my-3 text-slate-800"><Mail className="h-5 w-5 text-primary" /> Other questions → <Link href="/contact" className="text-primary underline">contact us</Link></p>

          <h2>6. Consequences</h2>
          <p>
            We respond to verified violations proportionately, typically: (a) notice + 7-day cure window, (b) feature-level suspension, (c) workspace suspension, (d) termination per the Terms of Service. Egregious violations (CSAM, active malware distribution, ongoing security incident) result in immediate suspension while we investigate.
          </p>

          <h2>7. Changes</h2>
          <p>Material changes are posted in our <Link href="/changelog" className="text-primary underline">changelog</Link> and emailed to workspace owners 30 days before they take effect.</p>
        </div>
      </section>
    </div>
  );
}
