import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MessageSquare, Github, Linkedin, BookOpen } from "lucide-react";
import { SEO } from "@/components/SEO";

const CHANNELS = [
  { icon: MessageSquare, title: "Slack — Auditee Practitioners", desc: "~600 BAs, QA leads, compliance managers and platform engineers. Channels by industry (#medtech, #automotive, #fintech, #defence) and standard (#aspice, #iec62304, #fda-qmsr, #dpdp).", cta: "Request invite", href: "/contact?topic=slack-invite" },
  { icon: Github, title: "GitHub", desc: "Open-source ReqIF parsers, our standards-mapping JSON files, the in-product i18n catalog, and example integration code.", cta: "Browse on GitHub", href: "https://github.com/auditee", external: true },
  { icon: Linkedin, title: "LinkedIn newsletter", desc: "\"The Audit-Ready Engineer\" — a fortnightly note for engineering leaders in regulated industries. ~4,200 subscribers.", cta: "Subscribe on LinkedIn", href: "https://linkedin.com/company/auditee", external: true },
  { icon: BookOpen, title: "Office hours (open call)", desc: "First Wednesday of each month. 45 min of live Q&A with our founders and a guest practitioner. No agenda — bring your hardest problem.", cta: "Reserve a seat", href: "/webinars" },
];

const RULES = [
  "Be useful. Sharp opinions are welcome; sharp tones are not.",
  "Don't dox other members or share screenshots that identify a customer without their consent.",
  "No recruiting in public channels (#jobs is the dedicated space).",
  "Vendors and consultants are welcome — name your affiliation upfront and don't pitch in DMs.",
  "Standards are nuanced. \"Read the standard\" is rarely a complete answer; explain your reasoning.",
];

export default function Community() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Community — Auditee Practitioners Slack, GitHub, Newsletter & Office Hours"
        description="Join 600+ regulated-industry practitioners — BAs, QA leads, compliance managers and platform engineers — in the Auditee Slack, GitHub, LinkedIn newsletter and monthly open office hours."
        path="/community"
        keywords={["Auditee community", "compliance practitioners", "ASPICE community", "MedTech community", "regulated industry slack"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/webinars" className="text-sm text-slate-700 hover:text-primary">Webinars</Link>
            <Link href="/help" className="text-sm text-slate-700 hover:text-primary">Help</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Community</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            A small, opinionated community of people building audit-ready software in regulated industries. No marketing, no fluff — just practitioners helping practitioners.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-5">
            {CHANNELS.map((c) => (
              <div key={c.title} className="bg-white border border-slate-200 rounded-2xl p-6">
                <c.icon className="h-7 w-7 text-primary mb-3" />
                <div className="font-display font-bold text-lg text-slate-950">{c.title}</div>
                <div className="text-sm text-slate-700 mt-2 mb-4">{c.desc}</div>
                {c.external ? (
                  <a href={c.href} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full">{c.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </a>
                ) : (
                  <Link href={c.href}>
                    <Button variant="outline" className="rounded-full">{c.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-4">Community rules</h2>
          <ol className="space-y-2 list-decimal list-inside text-slate-800">
            {RULES.map((r) => <li key={r}>{r}</li>)}
          </ol>
          <p className="text-sm text-slate-600 mt-6">Repeated violations earn a warning, then a temporary ban, then a permanent one. We're a small team and we'd rather over-moderate than let the room go bad.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want in?</h2>
          <p className="text-slate-300 mb-6">Slack invites are gated — tell us a sentence about what you do and we'll add you within one business day.</p>
          <Link href="/contact?topic=slack-invite">
            <Button size="lg" className="rounded-full" data-testid="community-invite-cta">Request a Slack invite<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
