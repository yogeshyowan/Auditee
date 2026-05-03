import { Link } from "wouter";
import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface MarketingPageData {
  path: string;
  eyebrow: string;
  EyebrowIcon: LucideIcon;
  title: string;
  highlight: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  capabilities: { icon: LucideIcon; title: string; desc: string }[];
  outcomes: { metric: string; label: string }[];
  pillars?: { title: string; bullets: string[] }[];
  standardsTitle?: string;
  standards?: string[];
  closingTitle: string;
  closingBody: string;
}

export function MarketingPage({ data }: { data: MarketingPageData }) {
  const Eyebrow = data.EyebrowIcon;
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title={data.seoTitle}
        description={data.seoDescription}
        path={data.path}
        keywords={data.keywords}
      />
      <Navigation />
      <main className="pt-28">
        <section className="px-6 py-16 md:py-24 max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-800 gap-1.5">
            <Eyebrow className="w-3.5 h-3.5" /> {data.eyebrow}
          </Badge>
          <h1 className="mt-6 text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight">
            {data.title}
            <span className="block text-primary mt-2">{data.highlight}</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">{data.description}</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2" data-testid="hero-cta-primary">
              <Link href={data.primaryCta.href}>
                {data.primaryCta.label} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            {data.secondaryCta && (
              <Button asChild size="lg" variant="outline" data-testid="hero-cta-secondary">
                <Link href={data.secondaryCta.href}>{data.secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-20 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              What Auditee actually does for you
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.capabilities.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-display font-bold text-slate-950">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {data.pillars && (
          <section className="bg-slate-50 px-6 py-16 md:py-20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
                  Where it shows up in your workflow
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.pillars.map((p) => (
                  <Card key={p.title} className="p-6 bg-white">
                    <h3 className="font-display text-lg font-bold text-slate-950 mb-3">{p.title}</h3>
                    <ul className="space-y-2">
                      {p.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {data.standards && data.standards.length > 0 && (
          <section className="px-6 py-16 md:py-20 max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <Badge variant="outline" className="bg-slate-50">Standards & frameworks</Badge>
              <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-slate-950">
                {data.standardsTitle ?? "Built-in coverage"}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {data.standards.map((s) => (
                <Badge key={s} variant="outline" className="text-sm py-1.5 px-3 bg-white">
                  {s}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className="bg-slate-50 px-6 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
                Outcomes teams report
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {data.outcomes.map((o) => (
                <Card key={o.label} className="p-6 text-center bg-white">
                  <div className="text-4xl font-display font-bold text-primary">{o.metric}</div>
                  <div className="mt-2 text-sm text-slate-600">{o.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">{data.closingTitle}</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">{data.closingBody}</p>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Button asChild size="lg" className="gap-2">
                <Link href="/contact">Book a demo <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
