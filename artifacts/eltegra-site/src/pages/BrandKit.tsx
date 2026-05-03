import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Download, Palette, Type, Image as ImageIcon } from "lucide-react";
import { SEO } from "@/components/SEO";

const COLORS = [
  { name: "Auditee Indigo", hex: "#4F46E5", swatch: "bg-indigo-600" },
  { name: "Slate 950 (Ink)", hex: "#020617", swatch: "bg-slate-950" },
  { name: "Slate 700 (Body)", hex: "#334155", swatch: "bg-slate-700" },
  { name: "Slate 50 (Surface)", hex: "#F8FAFC", swatch: "bg-slate-50 border border-slate-200" },
  { name: "Emerald 600 (Pass)", hex: "#059669", swatch: "bg-emerald-600" },
  { name: "Amber 600 (Warn)", hex: "#D97706", swatch: "bg-amber-600" },
];

const ASSETS = [
  { name: "Auditee wordmark — full colour (SVG)", href: "/opengraph.jpg", note: "Use on light backgrounds." },
  { name: "Auditee wordmark — white (SVG)", href: "/opengraph.jpg", note: "Use on dark backgrounds." },
  { name: "Auditee app icon (PNG, 512×512)", href: "/icon-512.png", note: "PWA / launcher icon. Maskable safe zone." },
  { name: "Auditee app icon (PNG, 192×192)", href: "/icon-192.png", note: "Smaller launcher / Apple touch." },
  { name: "OpenGraph card (1200×630)", href: "/opengraph.jpg", note: "Default social-share preview." },
  { name: "Hero network illustration (PNG)", href: "/hero-network.png", note: "Living-knowledge-graph hero." },
];

export default function BrandKit() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Brand Kit & Press Assets — Auditee"
        description="Download Auditee logos, wordmarks, app icons, OpenGraph images and brand colour palette. Includes usage guidelines for press, partners and integrations."
        path="/brand"
        keywords={["Auditee brand kit", "Auditee logo", "Auditee press kit", "Auditee media assets", "Auditee logo download"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/newsroom" className="text-sm text-slate-700 hover:text-primary">Newsroom</Link>
            <Link href="/about" className="text-sm text-slate-700 hover:text-primary">About</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Palette className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Brand kit &amp; press assets</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Everything you need to talk about Auditee in articles, integration listings, partner microsites or conference decks. Please follow the usage notes below — they keep the brand recognisable.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 mb-4 text-slate-700"><ImageIcon className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Logos &amp; assets</h2></div>
          <div className="grid md:grid-cols-2 gap-4">
            {ASSETS.map((a) => (
              <a key={a.name} href={a.href} download className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 hover:border-primary transition-colors">
                <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">{a.name}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{a.note}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 mb-4 text-slate-700"><Palette className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Colour palette</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {COLORS.map((c) => (
              <div key={c.hex} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className={`${c.swatch} h-20`} />
                <div className="p-3">
                  <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <div className="flex items-center gap-2 not-prose mb-2 text-slate-700"><Type className="h-5 w-5" /><h2 className="m-0">Typography</h2></div>
          <ul>
            <li><strong>Display</strong> — <em>Geist Sans</em>, weights 600 / 700. Used for headings, hero copy and product nav.</li>
            <li><strong>Body</strong> — <em>Inter</em>, weights 400 / 500. Used for paragraphs, tables and form labels.</li>
            <li><strong>Mono</strong> — <em>JetBrains Mono</em>, weight 400. Used for code, IDs and configuration snippets.</li>
          </ul>

          <h2>Naming &amp; capitalisation</h2>
          <ul>
            <li>The product name is <strong>Auditee</strong> — capitalised first letter, lowercase elsewhere. Never <em>AUDITEE</em>, <em>Audit-ee</em> or <em>auditee.io</em>.</li>
            <li>Our domain is <strong>auditee.site</strong>. Please link to it directly when referencing the product.</li>
            <li>The legal entity is <strong>Qwikstuffs Pvt. Ltd.</strong> — only use this in legal contexts (terms, contracts, invoices).</li>
          </ul>

          <h2>Don'ts</h2>
          <ul>
            <li>Don't recolour the wordmark, add drop shadows, outlines or gradients.</li>
            <li>Don't squash, rotate or skew the logo. Maintain the clear-space (≥ 1× cap-height on every side).</li>
            <li>Don't combine the Auditee wordmark with another logo without a divider or visible separation.</li>
            <li>Don't imply endorsement, partnership or integration without a written agreement — email{" "}
              <a href="mailto:partnerships@auditee.site" className="text-primary underline">partnerships@auditee.site</a> first.
            </li>
          </ul>

          <h2>Need something else?</h2>
          <p>
            Higher-resolution print files, lock-ups with partner logos, or product screenshots in a specific aspect ratio: email{" "}
            <a href="mailto:press@auditee.site" className="text-primary underline">press@auditee.site</a>. We typically respond within one business day.
          </p>
        </div>
      </section>
    </div>
  );
}
