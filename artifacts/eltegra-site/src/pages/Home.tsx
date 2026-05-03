import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PlayCircle,
  BrainCircuit,
  Database,
  ShieldCheck,
  Network,
  Search,
  Zap,
  Lightbulb,
  FileCode2,
  GitMerge,
  TestTube2,
  Rocket,
  Scale,
  Code2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation, SiteFooter, DemoDialog } from "@/components/site/Chrome";
import { WaitlistButton } from "@/components/site/WaitlistButton";
import { SEO } from "@/components/SEO";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

function ClickbaitHook() {
  const [dismissed, setDismissed] = useState(false);
  const [seats, setSeats] = useState(37);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("auditee.hook_dismissed") === "1") {
        setDismissed(true);
      }
    } catch {
      /* sessionStorage may be blocked */
    }
    const tick = setInterval(() => {
      setSeats((s) => (s > 12 ? s - 1 : s));
    }, 19000);
    return () => clearInterval(tick);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("auditee.hook_dismissed", "1");
    } catch {
      /* noop */
    }
  }

  if (dismissed) return null;

  return (
    <motion.aside
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-16 inset-x-2 sm:inset-x-4 z-40 mx-auto max-w-5xl rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50 via-white to-emerald-50 shadow-xl shadow-amber-200/30 backdrop-blur"
      data-testid="clickbait-hook"
      role="complementary"
      aria-label="Limited free access offer"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700">
          <span className="flex h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
          Live now
        </span>
        <p className="flex-1 min-w-[14rem] text-sm sm:text-base text-slate-800 font-medium">
          <span className="font-display font-bold text-slate-950">
            Your next audit could close in 48 hours, not 6 weeks.
          </span>{" "}
          <span className="text-slate-600">
            Free forever for the first <strong className="text-emerald-700">{seats}</strong>{" "}
            teams that sign up today — no card, full platform.
          </span>
        </p>
        <Link href="/sign-up" data-testid="hook-cta-signup">
          <Button
            size="sm"
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-semibold shadow-md shadow-emerald-600/30"
          >
            Claim my free seat
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss offer"
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          data-testid="hook-dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.aside>
  );
}

function Hero() {
  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/40 via-background to-background"></div>
        <img
          src="/hero-network.png"
          alt=""
          width="1920"
          height="1080"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover opacity-[0.03] mix-blend-multiply"
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              One PDLC platform. Every lifecycle stage.
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight text-slate-950 mb-6">
              Ship enterprise software with <span className="text-primary">total clarity</span> — from idea to audit.
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              Auditee is the AI-native control plane for the Product Development Lifecycle. It turns scattered requirements, legacy code and last-minute audit scrambles into one living knowledge graph the whole org can trust.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <DemoDialog>
                <Button size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90 text-white rounded-full text-base font-semibold">
                  Book a demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DemoDialog>
              <Link href="/app">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-semibold border-slate-300 hover:bg-slate-100 text-slate-900">
                  <PlayCircle className="mr-2 h-5 w-5 text-slate-500" />
                  Launch Platform
                </Button>
              </Link>
              <WaitlistButton
                size="lg"
                variant="secondary"
                className="h-14 px-8 rounded-full text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
                testId="hero-cta-waitlist"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            {/* Abstract UI representation */}
            <div className="relative w-full max-w-lg aspect-square rounded-full border border-primary/20 bg-white/40 backdrop-blur-3xl shadow-2xl flex items-center justify-center">
              <div className="absolute inset-4 rounded-full border border-primary/10 animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute inset-12 rounded-full border border-primary/10 animate-[spin_40s_linear_infinite_reverse]"></div>
              
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 z-10 shadow-[0_0_40px_rgba(0,136,58,0.3)]">
                <Network className="h-12 w-12 text-primary" />
              </div>

              {/* Orbiting nodes */}
              {[
                { icon: FileCode2, label: "Code", angle: 0 },
                { icon: ShieldCheck, label: "Compliance", angle: 72 },
                { icon: BrainCircuit, label: "AI Intent", angle: 144 },
                { icon: Database, label: "Legacy", angle: 216 },
                { icon: Layers, label: "Specs", angle: 288 },
              ].map((node, i) => (
                <div 
                  key={i} 
                  className="absolute w-14 h-14 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center z-20"
                  style={{
                    transform: `rotate(${node.angle}deg) translateY(-140px) rotate(-${node.angle}deg)`,
                    transition: "all 0.3s ease"
                  }}
                >
                  <node.icon className="h-6 w-6 text-slate-700" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatStrip() {
  const stats = [
    { value: "75%", label: "faster requirements" },
    { value: "40%", label: "faster delivery" },
    { value: "50%", label: "less rework" },
    { value: "95%", label: "compliance adherence" },
  ];

  return (
    <div className="border-y border-slate-200 bg-white relative z-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-slate-100">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeIn}
              className="text-center md:px-4"
            >
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2 tracking-tight">{stat.value}</div>
              <div className="text-sm md:text-base font-medium text-slate-600 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section id="problem" className="py-24 bg-slate-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-display font-bold leading-tight mb-6">
              You're flying blind <br/><span className="text-slate-500">without traceability.</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-lg text-slate-400 mb-10 max-w-lg">
              Fragmented tools create information silos. When requirements disconnect from code, enterprise velocity grinds to a halt.
            </motion.p>

            <div className="space-y-6">
              {[
                { title: "Hunting for context", desc: "Teams waste 40-50% of time hunting implementation details across repositories." },
                { title: "Compliance stalls", desc: "Audits become nightmares because you can't prove what's actually running in production." },
                { title: "Release uncertainty", desc: "Releases slip because nobody knows what features are truly complete and tested." },
                { title: "Legacy paralysis", desc: "Modernization fails when you can't map decades of old code back to business requirements." }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeIn} className="flex gap-4 items-start">
                  <div className="mt-1 bg-slate-900 border border-slate-800 p-2 rounded text-red-400">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-lg">{item.title}</h3>
                    <p className="text-slate-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                <Search size={120} />
              </div>
              <h3 className="text-xl font-display font-semibold text-slate-200 mb-6 flex items-center gap-2">
                <Code2 className="text-slate-500" />
                Fragmented Reality
              </h3>
              
              <div className="space-y-4">
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 flex justify-between items-center opacity-50">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded bg-blue-900/30 flex items-center justify-center text-blue-400">J</div>
                    <span className="text-slate-400 font-mono text-sm">PROJ-4892: Add 2FA support</span>
                  </div>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-500">Done</span>
                </div>
                <div className="flex justify-center -my-2 text-slate-700">
                  <X size={20} />
                </div>
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 flex justify-between items-center opacity-50">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400"><GitMerge size={16}/></div>
                    <span className="text-slate-400 font-mono text-sm">PR #102: Setup auth module</span>
                  </div>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-500">Merged</span>
                </div>
                <div className="flex justify-center -my-2 text-slate-700">
                  <X size={20} />
                </div>
                <div className="bg-slate-950 rounded-lg p-4 border border-red-900/30 flex justify-between items-center relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg"></div>
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded bg-red-900/20 flex items-center justify-center text-red-400"><ShieldCheck size={16}/></div>
                    <span className="text-slate-300 font-mono text-sm">SOC2 Audit Gap</span>
                  </div>
                  <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50">Missing Evidence</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PillarsSection() {
  const pillars = [
    {
      icon: BrainCircuit,
      title: "Product Management via Agentic AI",
      desc: "Captures product intent, generates structured artifacts (BRDs, PRDs, FRDs), and maintains a living knowledge graph.",
      metrics: "Reduces requirement defects 70% · Accelerates docs 75%"
    },
    {
      icon: Database,
      title: "Modernizing your Enterprise",
      desc: "Extracts semantic business logic, architecture, and dependencies from legacy systems (Angular, C#, C++, SQL).",
      metrics: "Modernize 50% faster · Reduce risk 80%"
    },
    {
      icon: ShieldCheck,
      title: "Autonomous Compliance & Regulations",
      desc: "Maps regulations to code, generates audit-ready evidence, and monitors compliance drift across 23+ frameworks.",
      metrics: "Cuts audit prep 80% · Reduces gaps 70%"
    },
    {
      icon: Network,
      title: "One Source of Truth",
      desc: "A unified, semantic, continuously updated knowledge graph that everyone in the organization trusts.",
      metrics: "Reduces knowledge gaps 80% · Speeds onboarding 70%"
    }
  ];

  return (
    <section id="platform" className="py-24 bg-white relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-950 mb-6">
            Inside the <span className="text-primary">Living Knowledge Graph</span>
          </h2>
          <p className="text-lg text-slate-600">
            Four intelligence pillars that reshape how enterprise software gets planned, built and signed off.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-8 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-colors duration-300">
                <pillar.icon className="h-7 w-7 text-slate-700 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 mb-3">{pillar.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{pillar.desc}</p>
              <div className="inline-block bg-secondary/30 text-primary font-medium px-4 py-2 rounded-lg text-sm border border-primary/10">
                {pillar.metrics}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PdlcCoverage() {
  const stages = [
    { icon: Lightbulb, title: "Ideation", desc: "Smart interviews extract requirements from conversations." },
    { icon: Layers, title: "Design", desc: "Auto-generate BRDs, PRDs, FRDs with validation." },
    { icon: FileCode2, title: "Development", desc: "Bidirectional traceability between requirements & code." },
    { icon: TestTube2, title: "Testing", desc: "Auto-generate test cases linked directly to requirements." },
    { icon: Rocket, title: "Launch", desc: "Track deployment success and monitor feature adoption." },
    { icon: Scale, title: "Governance", desc: "Continuous compliance scoring across 23+ frameworks." },
  ];

  return (
    <section id="pdlc" className="py-24 bg-slate-50 border-y border-slate-200 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950 mb-4">
            End-to-end PDLC coverage
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            From the first whiteboard sketch to post-launch governance, Auditee threads context through every stage of the lifecycle — no handoff loses the plot.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-6 right-6 h-0.5 bg-slate-200 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
            {stages.map((stage, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative"
              >
                <div className="w-24 h-24 mx-auto bg-white rounded-full border-4 border-slate-50 shadow-sm flex items-center justify-center mb-6 relative group hover:border-primary/20 transition-colors">
                  <stage.icon className="h-8 w-8 text-primary" />
                  <div className="absolute -inset-2 rounded-full border border-primary/0 group-hover:border-primary/30 group-hover:scale-110 transition-all duration-300"></div>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-slate-900 mb-2">{stage.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{stage.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section id="capabilities" className="py-24 bg-white relative overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-16 md:w-2/3"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-950 mb-6">
            Deep <span className="text-primary">product intelligence</span>, end to end.
          </h2>
          <p className="text-lg text-slate-600">
            Capabilities engineered to close the gap between business intent and the code that actually ships.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            {
              title: "Legacy Code + Requirements Bidirectional Sync",
              items: [
                "Ingest Angular, C#, C++, C, SQL",
                "Reverse-engineer legacy systems",
                "Map new requirements to implementation",
                "Query: 'Where is payment processing implemented?'"
              ]
            },
            {
              title: "Automated Gap Detection",
              items: [
                "AI analyzes against industry standards",
                "Flags missing security/compliance logic",
                "Detects conflicts and duplicates",
                "Suggests corrections from 20+ yrs domain expertise"
              ]
            },
            {
              title: "Requirements-to-Code Traceability",
              items: [
                "Jira tickets ↔ functions in code",
                "Scope the live graph to one framework (SOC 2, HIPAA, GDPR, PCI, ISO 27001, FDA 21 CFR 11…)",
                "Prove every regulatory control maps to shipping code",
                "Continuous, framework-aware auditing"
              ]
            }
          ].map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-slate-50 rounded-2xl p-8 border border-slate-200"
            >
              <h3 className="text-xl font-bold font-display text-slate-900 mb-6 h-14">{cap.title}</h3>
              <ul className="space-y-4">
                {cap.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-slate-600 items-start">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoiSection() {
  return (
    <section id="roi" className="py-24 relative overflow-hidden bg-slate-950 text-white scroll-mt-24">
      <div className="absolute inset-0 z-0">
        <img
          src="/roi-bg.png"
          alt=""
          width="1920"
          height="1080"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-20 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-slate-950/80"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-medium text-sm mb-8 border border-white/20 backdrop-blur-sm">
            <Zap className="h-4 w-4 text-yellow-400" />
            The ROI of Traceability
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-8">
            The <span className="text-primary">$400,000</span> question.
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            That's the average price tag of a failed compliance audit or a slipped enterprise release caused by misaligned requirements. Stop paying the chaos tax.
          </p>
          <Link href="/roi-calculator">
            <Button size="lg" className="h-14 px-8 bg-white hover:bg-slate-100 text-slate-950 rounded-full text-base font-semibold" data-testid="button-roi-cta">
              Calculate your savings
              <ArrowUpRight className="ml-2 h-5 w-5 text-slate-500" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="cta" className="py-32 bg-secondary/30 relative scroll-mt-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className="text-5xl md:text-7xl font-display font-bold text-slate-950 mb-6 tracking-tight">
            End the requirements chaos.
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Join the enterprise teams shipping faster, safer and with full provenance — powered by Auditee.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <DemoDialog>
              <Button size="lg" className="h-16 px-10 bg-primary hover:bg-primary/90 text-white rounded-full text-lg font-semibold shadow-xl shadow-primary/20" data-testid="button-final-book-demo">
                Book a demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </DemoDialog>
            <Link href="/app">
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-lg font-semibold border-primary/20 hover:bg-primary/5 text-primary bg-white" data-testid="button-final-launch-app">
                Get live demo access
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Anchor stubs for the dropdown links that don't yet have rich sections of
// their own. Keeps in-page navigation clickable and gives the marketing
// pages a clear scroll target.
function ResourcesAnchor() {
  const cards: { title: string; desc: string; cta: string; href: string; testId: string }[] = [
    {
      title: "Customer stories",
      desc: "How regulated enterprises moved from spreadsheet audits to a continuous knowledge graph.",
      cta: "Read case studies",
      href: "/about",
      testId: "link-resources-customer-stories",
    },
    {
      title: "Documentation",
      desc: "Connector reference, ingestion limits, the graph query API and the full platform feature set.",
      cta: "Open docs",
      href: "/features",
      testId: "link-resources-docs",
    },
    {
      title: "Webinars & guides",
      desc: "Practitioner research, buyer's guides and standards walkthroughs from the Auditee team.",
      cta: "Browse library",
      href: "/blog",
      testId: "link-resources-blog",
    },
  ];
  return (
    <section id="resources" className="py-20 bg-slate-50 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-3 gap-8">
        {cards.map((r) => (
          <div key={r.title} className="rounded-2xl bg-white border border-slate-200 p-8">
            <h3 className="text-xl font-bold font-display text-slate-900 mb-3">{r.title}</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{r.desc}</p>
            <Button
              asChild
              variant="outline"
              className="rounded-full text-primary border-primary/30 hover:bg-primary/5"
            >
              <Link href={r.href} data-testid={r.testId}>
                {r.cta}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function SolutionsAnchor() {
  return (
    <section id="solutions" className="py-20 bg-white scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-3xl md:text-5xl font-display font-bold text-slate-950 mb-4">
          Built for the teams under pressure.
        </motion.h2>
        <p className="text-lg text-slate-600 max-w-2xl mb-12">
          Whether you're shipping the next release, modernising a 20-year codebase or preparing the next audit, Auditee speaks your team's language.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Product Teams", desc: "Capture intent in conversation, leave with a fully-formed PRD.", icon: Lightbulb },
            { title: "Engineering", desc: "Trace any requirement to the function (and PR) that owns it.", icon: Code2 },
            { title: "Compliance & Audit", desc: "Continuous SOC2, HIPAA, FDA and ISO evidence — never scrambled.", icon: ShieldCheck },
            { title: "Legacy Modernisation", desc: "Reverse-engineer Angular, C#, C++ and SQL into living specs.", icon: Database },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 p-6 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <s.icon size={22} />
              </div>
              <h3 className="font-bold font-display text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompanyAnchor() {
  return (
    <section id="company" className="py-20 bg-slate-50 scroll-mt-24">
      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-950 mb-6">
          About Auditee.
        </h2>
        <p className="text-lg text-slate-600 mb-8 max-w-3xl mx-auto">
          We're an AI-native team rebuilding the Product Development Lifecycle for the era where requirements, code and audit evidence have to live as one connected graph. Headquartered remote-first, with engineers and domain experts spread across three continents.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <DemoDialog>
            <Button variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/5">Talk to the team</Button>
          </DemoDialog>
          <Link href="/about">
            <Button variant="ghost" className="rounded-full text-slate-700 hover:bg-slate-100">Read our story</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}


const HOME_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Auditee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Auditee is an AI-native enterprise platform for the Product Development Lifecycle (PDLC). It unifies requirements management, source code, compliance audits, and CAPA workflows into a single living knowledge graph, with built-in support for ASPICE, ISO 26262, IEC 62304, CMMI, SOC 2, ISO 27001, HIPAA, FDA QMSR, GDPR, PCI DSS, NIST, EU AI Act, NIS2, and DORA.",
      },
    },
    {
      "@type": "Question",
      name: "Which standards does Auditee support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Auditee includes standards-aware generation for HIPAA, IEC 62304, IEC 61508, ISO 13485, ISO 26262, ISO 27001, SOC 2, ASPICE, CMMI, DO-178C, FDA 21 CFR Part 11, FDA QMSR, GDPR, PCI DSS, NIST CSF, NIST 800-53, EU AI Act, NIS2, DORA, and IEC 62443. Each framework drives required document sections, requirement coverage topics, and inline citation hints.",
      },
    },
    {
      "@type": "Question",
      name: "Can Auditee import from IBM DOORS, Jama, Polarion, or Jira?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Auditee includes first-party connectors for IBM DOORS, IBM DOORS Next (OSLC), Jama Connect, Siemens Polarion, PTC codeBeamer, Perforce Helix RM, Visure Requirements ALM, Microsoft Azure DevOps Boards, Atlassian Jira, plus a generic ReqIF importer and code sources via GitHub, ZIP and folder uploads.",
      },
    },
    {
      "@type": "Question",
      name: "Can Auditee generate requirements from existing code?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Auditee reads source code (TypeScript, JavaScript, Python, Java, Kotlin, C#, C/C++, Go, Rust, COBOL, SQL, and more) and generates structured, standards-conformant requirements with traceability links back to specific files, classes or routes. Standards selected by the user (HIPAA, IEC 62304, SOC 2, etc.) shape the generated set's coverage and citations.",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900 selection:bg-primary/20 selection:text-primary">
      <SEO
        title="Auditee — AI Platform for Requirements, Compliance & Audit Automation"
        description="Auditee is the AI-native PDLC platform. Unify requirements, code, audits and compliance into one living knowledge graph. Automate HIPAA, IEC 62304, ASPICE, ISO 26262, CMMI, SOC 2, ISO 27001, FDA QMSR, GDPR, PCI DSS audits."
        path="/"
        keywords={[
          "AI requirements management",
          "AI compliance automation",
          "PDLC platform",
          "audit automation",
          "requirements traceability",
          "ASPICE automation",
          "ISO 26262 compliance",
          "IEC 62304",
          "SOC 2 automation",
          "HIPAA compliance",
          "FDA QMSR",
          "DOORS alternative",
          "Jama alternative",
          "Polarion alternative",
        ]}
        jsonLd={[HOME_FAQ_LD]}
      />
      <Navigation />
      <ClickbaitHook />
      <main>
        <Hero />
        <StatStrip />
        <ProblemSection />
        <PillarsSection />
        <SolutionsAnchor />
        <PdlcCoverage />
        <Capabilities />
        <RoiSection />
        <ResourcesAnchor />
        <CompanyAnchor />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
