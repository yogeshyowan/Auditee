import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Briefcase, Newspaper, ShieldCheck, MessageSquare, Loader2, Check, MapPin, Phone, Receipt, Linkedin } from "lucide-react";

const REASONS = [
  { value: "sales", label: "Talk to sales", icon: MessageSquare },
  { value: "demo", label: "Book a product demo", icon: ShieldCheck },
  { value: "press", label: "Press / media inquiry", icon: Newspaper },
  { value: "careers", label: "Careers / hiring", icon: Briefcase },
  { value: "support", label: "Customer support", icon: Mail },
];

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export default function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [reason, setReason] = useState("sales");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: "Missing info", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const reasonLabel = REASONS.find((r) => r.value === reason)?.label ?? reason;
      const composedMessage = `[${reasonLabel}]${message.trim() ? `\n\n${message.trim()}` : ""}`;
      const r = await fetch(`${apiBase}/demo-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          message: composedMessage,
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        let msg = text || `Request failed (${r.status})`;
        try {
          const j = JSON.parse(text);
          msg = j.error || j.message || msg;
        } catch {}
        throw new Error(msg);
      }
      setSuccess(true);
      toast({ title: "Message sent", description: "We'll be in touch within one business day." });
    } catch (err) {
      toast({
        title: "Couldn't send",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Contact Auditee — Sales, Demos, Press & Support"
        description="Get in touch with Auditee. Talk to sales, book a personalized product demo, contact press, or reach customer support. Response within one business day."
        path="/contact"
        keywords={["contact Auditee", "Auditee demo", "Auditee sales", "Auditee support"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-slate-700 hover:text-primary">Pricing</Link>
            <Link href="/about" className="text-sm text-slate-700 hover:text-primary">About</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-secondary/30 to-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 tracking-tight mb-4">
              Talk to <span className="text-primary">Auditee.</span>
            </h1>
            <p className="text-lg text-slate-600">
              Sales, support, partnerships, hiring or press — pick the right inbox below and we'll route your message internally within one business day.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {success ? (
              <Card className="p-12 text-center" data-testid="contact-success">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-950 mb-3">Message received.</h2>
                <p className="text-slate-600 mb-6">
                  Thanks {name.split(" ")[0] || "there"} — your note has been routed to the right team. Expect a reply within one business day.
                </p>
                <Link href="/">
                  <Button variant="outline" className="rounded-full">Back to home</Button>
                </Link>
              </Card>
            ) : (
              <Card className="p-8">
                <form onSubmit={submit} className="space-y-5" data-testid="contact-form">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="mb-1.5 block">Full name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                        data-testid="contact-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-1.5 block">Work email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        required
                        data-testid="contact-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company" className="mb-1.5 block">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme MedTech Inc."
                      data-testid="contact-company"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Reason for reaching out *</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger data-testid="contact-reason">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REASONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message" className="mb-1.5 block">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us a bit about what you're trying to solve…"
                      rows={5}
                      data-testid="contact-message"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full px-6"
                    data-testid="contact-submit"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
                      </>
                    ) : (
                      "Send message"
                    )}
                  </Button>
                  <p className="text-xs text-slate-500">
                    By submitting, you agree we may store your details to respond to your inquiry. We never share your email or message with third parties.
                  </p>
                </form>
              </Card>
            )}
          </div>

          {/* Side info */}
          <div className="space-y-4">
            <Card className="p-5 bg-gradient-to-br from-primary/5 to-white border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-slate-900 mb-1">Registered office</div>
                  <div className="text-slate-700 leading-relaxed">
                    <span className="font-medium text-slate-900">Qwikstuffs Pvt. Ltd.</span><br />
                    E2, Devi Building, Metu Street,<br />
                    Iyyapanthangal, Chennai 600 077<br />
                    Tamil Nadu, India
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-primary" />
                      <a href="tel:+918310042593" className="hover:text-primary">+91 83100 42593</a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Receipt className="h-3 w-3 text-primary" />
                      <span>GSTIN <span className="font-mono">33AFDPY2309C3ZR</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Linkedin className="h-3 w-3 text-primary" />
                      <a
                        href="https://www.linkedin.com/feed/?shareActive=true"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-primary"
                      >
                        Founder &amp; CEO — Yogesh Yowan
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            {REASONS.map((r) => (
              <Card key={r.value} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <r.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm mb-0.5">{r.label}</div>
                    <div className="text-xs text-slate-600">
                      {r.value === "sales" && "Pricing, procurement, security review."}
                      {r.value === "demo" && "Live walkthrough scoped to your stack and frameworks."}
                      {r.value === "press" && "Media kit, executive interviews, brand assets."}
                      {r.value === "careers" && "Open roles + general interest applications."}
                      {r.value === "support" && "Existing customer? We respond within 4 business hours."}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
