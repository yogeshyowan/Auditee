import { Link } from "wouter";
import { ArrowRight, Check, X, Minus, type LucideIcon } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ComparisonValue = "yes" | "partial" | "no" | string;

export interface ComparisonRow {
  capability: string;
  auditee: ComparisonValue;
  competitor: ComparisonValue;
  note?: string;
}

export interface ComparisonSection {
  title: string;
  rows: ComparisonRow[];
}

export interface ComparisonPageData {
  path: string;
  competitorName: string;
  competitorTagline: string;
  EyebrowIcon: LucideIcon;
  hero: { headline: string; sub: string };
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  positioning: string;
  whenCompetitorWins: string[];
  whenAuditeeWins: string[];
  sections: ComparisonSection[];
  migrationNote: string;
}

function Cell({ value }: { value: ComparisonValue }) {
  if (value === "yes") return <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="w-4 h-4" /> Yes</span>;
  if (value === "no") return <span className="inline-flex items-center gap-1 text-slate-400"><X className="w-4 h-4" /> No</span>;
  if (value === "partial") return <span className="inline-flex items-center gap-1 text-amber-600"><Minus className="w-4 h-4" /> Partial</span>;
  return <span className="text-slate-700 text-sm">{value}</span>;
}

export function ComparisonPage({ data }: { data: ComparisonPageData }) {
  const Eyebrow = data.EyebrowIcon;
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title={data.seoTitle}
        description={data.seoDescription}
        path={data.path}
        keywords={data.keywords}
        jsonLd={breadcrumbsLd([
          { name: "Home", path: "/" },
          { name: "Compare", path: "/compare" },
          { name: data.competitorName, path: data.path },
        ])}
      />
      <Navigation />
      <main className="pt-28">
        <section className="px-6 py-16 max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="bg-slate-50 gap-1.5">
            <Eyebrow className="w-3.5 h-3.5" /> Auditee vs {data.competitorName}
          </Badge>
          <h1 className="mt-6 text-4xl md:text-5xl font-display font-bold text-slate-950 tracking-tight">
            {data.hero.headline}
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">{data.hero.sub}</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">Book a side-by-side <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </section>

        <section className="px-6 pb-16 max-w-4xl mx-auto">
          <Card className="p-6 md:p-8 bg-slate-50 border-slate-200">
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-3">How we position</h2>
            <p className="text-slate-700">{data.positioning}</p>
          </Card>
        </section>

        <section className="px-6 pb-16 max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <Card className="p-6 border-emerald-200 bg-emerald-50/40">
            <h3 className="font-display text-lg font-bold text-slate-950 mb-3">When Auditee wins</h3>
            <ul className="space-y-2">
              {data.whenAuditeeWins.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6 border-slate-200 bg-white">
            <h3 className="font-display text-lg font-bold text-slate-950 mb-3">When {data.competitorName} wins</h3>
            <ul className="space-y-2">
              {data.whenCompetitorWins.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="bg-slate-50 px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950 text-center mb-10">
              Capability comparison
            </h2>
            <div className="space-y-10">
              {data.sections.map((s) => (
                <div key={s.title}>
                  <h3 className="font-display text-lg font-bold text-slate-950 mb-3">{s.title}</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold w-1/2">Capability</th>
                          <th className="text-left px-4 py-3 font-semibold">Auditee</th>
                          <th className="text-left px-4 py-3 font-semibold">{data.competitorName}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {s.rows.map((r) => (
                          <tr key={r.capability}>
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-slate-900">{r.capability}</div>
                              {r.note && <div className="text-xs text-slate-500 mt-0.5">{r.note}</div>}
                            </td>
                            <td className="px-4 py-3 align-top"><Cell value={r.auditee} /></td>
                            <td className="px-4 py-3 align-top"><Cell value={r.competitor} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-slate-950">Migrating from {data.competitorName}?</h2>
          <p className="mt-4 text-slate-600">{data.migrationNote}</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">Book a migration scoping <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/requirements-management">Connect, don't migrate</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
