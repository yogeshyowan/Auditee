import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const COOKIES = [
  { name: "auditee_session", purpose: "Authenticated session cookie. Required for sign-in.", category: "Strictly necessary", duration: "Session", first: true },
  { name: "auditee_csrf", purpose: "CSRF protection token for state-changing requests.", category: "Strictly necessary", duration: "Session", first: true },
  { name: "auditee_theme", purpose: "Stores your chosen colour scheme (light/dark/auto).", category: "Functional", duration: "1 year", first: true },
  { name: "auditee_consent", purpose: "Records your cookie consent choices so we don't ask again.", category: "Strictly necessary", duration: "12 months", first: true },
  { name: "_ga, _ga_*", purpose: "Google Analytics 4 — anonymised page-view + funnel measurement. Honors DNT and Sec-GPC.", category: "Analytics", duration: "Up to 2 years", first: false },
  { name: "rzp_*", purpose: "Razorpay checkout cookies. Set only when you initiate a payment from /pricing.", category: "Strictly necessary (payment)", duration: "Session", first: false },
];

export default function CookiePolicy() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Cookie Policy — Auditee"
        description="How Auditee uses cookies, what each cookie does, how long it lasts, and how to control them. Auditee honors Do-Not-Track and Global Privacy Control signals."
        path="/cookie-policy"
        keywords={["Auditee cookie policy", "GDPR cookies", "ePrivacy cookies", "DNT", "Global Privacy Control"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-sm text-slate-700 hover:text-primary">Privacy</Link>
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Cookie policy</h1>
          <p className="text-slate-700">Last updated: 03 May 2026 · Effective immediately.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>1. What are cookies?</h2>
          <p>
            Cookies are small text files a website asks your browser to store on your device. Modern browsers also expose related storage (localStorage, sessionStorage, IndexedDB). This policy covers all of them, even though we use the word "cookies" for short.
          </p>

          <h2>2. The categories we use</h2>
          <ul>
            <li><strong>Strictly necessary</strong> — sign-in, CSRF, payment. The site does not work without these. Cannot be disabled.</li>
            <li><strong>Functional</strong> — remembering your theme or workspace selection.</li>
            <li><strong>Analytics</strong> — measuring which pages convert and which break, in aggregate. Optional.</li>
            <li><strong>Marketing</strong> — we currently do <strong>not</strong> set marketing or third-party advertising cookies.</li>
          </ul>

          <h2>3. The exact cookies we set</h2>
          <div className="not-prose overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full text-sm border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Purpose</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Category</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Duration</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Origin</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.name} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-2 font-mono text-xs text-slate-800">{c.name}</td>
                    <td className="px-3 py-2 text-slate-700">{c.purpose}</td>
                    <td className="px-3 py-2 text-slate-700">{c.category}</td>
                    <td className="px-3 py-2 text-slate-700">{c.duration}</td>
                    <td className="px-3 py-2 text-slate-700">{c.first ? "First-party" : "Third-party"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>4. Do-Not-Track &amp; Global Privacy Control</h2>
          <p>
            Auditee respects the W3C <code>DNT: 1</code> header and the <code>Sec-GPC: 1</code> Global Privacy Control header per our public <Link href="/.well-known/dnt-policy.txt" className="text-primary underline">DNT policy</Link>. When either header is present we drop analytics and shorten log retention to 10 days.
          </p>

          <h2>5. How to control cookies</h2>
          <ul>
            <li>Most browsers let you block or delete cookies in their privacy settings.</li>
            <li>You can revoke analytics consent any time from the cookie banner footer link "Cookie preferences".</li>
            <li>For the audit trail of your own consent choices, email <a href="mailto:privacy@auditee.site" className="text-primary underline">privacy@auditee.site</a>.</li>
          </ul>

          <h2>6. Changes to this policy</h2>
          <p>
            Material changes are announced via the in-app notification centre and emailed to workspace owners 30 days before they take effect. The full revision history lives in our <Link href="/changelog" className="text-primary underline">public changelog</Link>.
          </p>

          <h2>7. Contact</h2>
          <p>
            Data Protection Officer: <a href="mailto:dpo@auditee.site" className="text-primary underline">dpo@auditee.site</a>. Mailing address: see our <Link href="/contact" className="text-primary underline">contact page</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
