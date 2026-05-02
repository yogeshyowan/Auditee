import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Menu, X, ShieldCheck, ChevronRight, ArrowRight, MapPin, Phone, Linkedin, Receipt } from "lucide-react";
import { Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateDemoRequest } from "@workspace/api-client-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

type NavGroup = {
  label: string;
  key: string;
  items: { title: string; desc: string; href: string; external?: boolean }[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Platform",
    key: "platform",
    items: [
      { title: "AI Product Development", desc: "From idea to shipped feature — Smart Interview, BRDs, traceability and tests.", href: "/ai-product-development" },
      { title: "AI Requirements Management", desc: "Unify DOORS, Jama, Jira + AI generation in one knowledge graph.", href: "/ai-requirements-management" },
      { title: "Missing Requirements Analysis", desc: "AI Gap Detection finds the requirements you forgot to write.", href: "/missing-requirements-analysis" },
      { title: "Test Case Generation", desc: "Auto-generate structured test suites from every requirement.", href: "/test-case-generation" },
      { title: "Automated Compliance", desc: "Continuous control-by-control evidence across 23+ frameworks.", href: "/automated-compliance" },
    ],
  },
  {
    label: "Solutions",
    key: "solutions",
    items: [
      { title: "Product Teams", desc: "From idea to PRD without the doc-juggling.", href: "/#solutions" },
      { title: "Engineering", desc: "Find the function that owns any requirement.", href: "/#solutions" },
      { title: "Compliance & Audit", desc: "Always-fresh evidence for SOC2, HIPAA, FDA, ISO.", href: "/#solutions" },
      { title: "Legacy Modernization", desc: "Reverse-engineer Angular, C#, C++ and SQL estates.", href: "/#solutions" },
    ],
  },
  {
    label: "Resources",
    key: "resources",
    items: [
      { title: "Blog", desc: "Buyer's guides, standards walkthroughs and field notes.", href: "/blog" },
      { title: "Features", desc: "The complete platform feature set, end-to-end.", href: "/features" },
      { title: "ROI Calculator", desc: "Quantify the cost of audit chaos in your org.", href: "/roi-calculator" },
      { title: "Pricing", desc: "Plans for teams, scale-ups and enterprises.", href: "/pricing" },
      { title: "Security & Trust", desc: "Encryption, SSO, audit logs, SOC 2 / ISO 27001 / GDPR posture.", href: "/security" },
      { title: "Investor / Sales Deck", desc: "The full Auditee story in slides — vision, traction, GTM.", href: "/auditee-deck/", external: true },
      { title: "PDLC Coverage", desc: "See how Auditee maps to every lifecycle stage.", href: "/#pdlc" },
    ],
  },
  {
    label: "Company",
    key: "company",
    items: [
      { title: "About", desc: "The team rebuilding the PDLC for the AI era.", href: "/about" },
      { title: "Careers", desc: "Join us. Remote-first, mission-led.", href: "/about#careers" },
      { title: "Press", desc: "News, releases and brand assets.", href: "/about#press" },
      { title: "Contact", desc: "Talk to sales, partnerships or support.", href: "/contact" },
    ],
  },
];

function isInternalRoute(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.includes("#");
}

const demoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  message: z.string().optional(),
});

export function DemoDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createDemo = useCreateDemoRequest();
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof demoSchema>>({
    resolver: zodResolver(demoSchema),
    defaultValues: { name: "", email: "", company: "", message: "" },
  });

  const onSubmit = async (values: z.infer<typeof demoSchema>) => {
    try {
      await createDemo.mutateAsync({ data: values });
      setSuccess(true);
      form.reset();
    } catch (e) {
      toast({ title: "Error", description: "Could not submit request. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setTimeout(() => setSuccess(false), 300);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-bold font-display text-slate-900">Request Received</h3>
            <p className="text-slate-500">We'll be in touch shortly to schedule your personalized demo of Auditee.</p>
            <Button onClick={() => setOpen(false)} className="mt-4 w-full">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">See Auditee in action</DialogTitle>
              <DialogDescription>Schedule a personalized walkthrough of the platform.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl><Input placeholder="jane@company.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl><Input placeholder="Acme Corp" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>What are you looking to solve?</FormLabel>
                    <FormControl><Textarea placeholder="Tell us about your current challenges..." className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-12 text-base mt-2" disabled={createDemo.isPending}>
                  {createDemo.isPending ? "Submitting..." : "Request Demo"}
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5 z-50 relative font-display font-bold text-2xl tracking-tight text-slate-950">
      <span className="text-primary">Auditee</span>
    </Link>
  );
}

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md border-slate-200 py-3 shadow-sm"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <Logo />

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {NAV_GROUPS.map((group) => (
              <NavigationMenuItem key={group.key}>
                <NavigationMenuTrigger
                  className="bg-transparent text-slate-600 hover:text-primary data-[state=open]:text-primary"
                  data-testid={`nav-trigger-${group.key}`}
                >
                  {group.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 p-4 w-[440px] md:w-[520px] grid-cols-2">
                    {group.items.map((item) => {
                      const inner = (
                        <>
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-primary mb-1">
                            {item.title}
                          </div>
                          <p className="text-xs text-slate-500 leading-snug">{item.desc}</p>
                        </>
                      );
                      const className = "block rounded-md p-3 hover:bg-slate-100 transition-colors group";
                      const testId = `nav-item-${group.key}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                      // Items marked `external` (e.g. the slides artifact at /auditee-deck/)
                      // live outside this SPA's wouter routes — they must use a real <a>.
                      const useWouterLink = !item.external && isInternalRoute(item.href);
                      return (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            {useWouterLink ? (
                              <Link href={item.href} className={className} data-testid={testId}>
                                {inner}
                              </Link>
                            ) : (
                              <a
                                href={item.href}
                                className={className}
                                data-testid={testId}
                                {...(item.external ? { target: "_blank", rel: "noopener" } : {})}
                              >
                                {inner}
                              </a>
                            )}
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/pricing" className="text-sm font-medium text-slate-700 hover:text-primary transition-colors" data-testid="link-pricing-top">
            Pricing
          </Link>
          <Show when="signed-in">
            <Link href="/app" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors" data-testid="link-launch-app-top">
              Launch Platform
            </Link>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium text-slate-700 hover:text-primary transition-colors" data-testid="link-sign-in-top">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors" data-testid="link-sign-up-top">
              Get started
            </Link>
          </Show>
          <DemoDialog>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6" data-testid="button-book-demo-top">
              Book a demo
            </Button>
          </DemoDialog>
        </div>

        <button
          className="md:hidden z-50 relative text-slate-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-toggle-mobile-menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-24 px-6 pb-6 flex flex-col h-screen overflow-y-auto">
          <nav className="flex flex-col gap-2 text-base font-medium">
            {NAV_GROUPS.map((group) => {
              const isOpen = openMobileGroup === group.key;
              return (
                <div key={group.key} className="border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between py-3 text-lg font-semibold text-slate-900"
                    onClick={() => setOpenMobileGroup(isOpen ? null : group.key)}
                    data-testid={`mobile-nav-trigger-${group.key}`}
                  >
                    {group.label}
                    <ChevronRight
                      size={20}
                      className={`transition-transform ${isOpen ? "rotate-90 text-primary" : "text-slate-400"}`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="pl-2 pb-2 space-y-2">
                      {group.items.map((item) => (
                        <li key={item.title}>
                          <a
                            href={item.href}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setOpenMobileGroup(null);
                            }}
                            className="block py-2 text-sm text-slate-600 hover:text-primary"
                          >
                            <span className="font-medium text-slate-800">{item.title}</span>
                            <span className="block text-xs text-slate-500">{item.desc}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="mt-8 flex flex-col gap-4">
            <Show when="signed-in">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 border border-primary text-primary rounded-lg font-medium"
              >
                Launch Platform
              </Link>
            </Show>
            <Show when="signed-out">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 border border-slate-200 text-slate-900 rounded-lg font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 border border-primary text-primary rounded-lg font-medium"
              >
                Get started
              </Link>
            </Show>
            <DemoDialog>
              <Button className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-white rounded-lg">Book a demo</Button>
            </DemoDialog>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-950 py-16 border-t border-slate-900 text-slate-400" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-1.5 font-display font-bold text-2xl tracking-tight text-white mb-6">
              <span className="text-primary">Auditee</span>
            </Link>
            <p className="text-slate-400 max-w-sm mb-6">
              The AI-native platform for the entire Product Development Lifecycle. Turn chaos into a living knowledge graph.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
              data-testid="link-footer-blog-cta"
            >
              Read the blog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link href="/ai-product-development" className="hover:text-primary transition-colors" data-testid="link-footer-ai-product-development">AI Product Development</Link></li>
              <li><Link href="/ai-requirements-management" className="hover:text-primary transition-colors" data-testid="link-footer-ai-requirements">AI Requirements</Link></li>
              <li><Link href="/missing-requirements-analysis" className="hover:text-primary transition-colors" data-testid="link-footer-gap-analysis">Gap Analysis</Link></li>
              <li><Link href="/test-case-generation" className="hover:text-primary transition-colors" data-testid="link-footer-test-generation">Test Generation</Link></li>
              <li><Link href="/automated-compliance" className="hover:text-primary transition-colors" data-testid="link-footer-automated-compliance">Automated Compliance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Solutions</h4>
            <ul className="space-y-4">
              <li><a href="/#solutions" className="hover:text-primary transition-colors" data-testid="link-footer-product-teams">For Product Teams</a></li>
              <li><a href="/#solutions" className="hover:text-primary transition-colors" data-testid="link-footer-engineering">For Engineering</a></li>
              <li><a href="/#solutions" className="hover:text-primary transition-colors" data-testid="link-footer-compliance">For Compliance</a></li>
              <li><a href="/#solutions" className="hover:text-primary transition-colors" data-testid="link-footer-legacy">Legacy Modernization</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><Link href="/blog" className="hover:text-primary transition-colors" data-testid="link-footer-blog">Blog</Link></li>
              <li><Link href="/features" className="hover:text-primary transition-colors" data-testid="link-footer-features">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors" data-testid="link-footer-pricing">Pricing</Link></li>
              <li><Link href="/roi-calculator" className="hover:text-primary transition-colors" data-testid="link-footer-roi">ROI Calculator</Link></li>
              <li><Link href="/security" className="hover:text-primary transition-colors" data-testid="link-footer-security">Security & Trust</Link></li>
              <li><a href="/auditee-deck/" target="_blank" rel="noopener" className="hover:text-primary transition-colors" data-testid="link-footer-deck">Investor Deck</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="hover:text-primary transition-colors" data-testid="link-footer-about">About Us</Link></li>
              <li><a href="/about#careers" className="hover:text-primary transition-colors" data-testid="link-footer-careers">Careers</a></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors" data-testid="link-footer-contact">Contact</Link></li>
              <li><Link href="/app" className="hover:text-primary transition-colors" data-testid="link-footer-launch">Launch Platform</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 grid gap-8 md:grid-cols-3 text-sm">
          <div>
            <h5 className="text-white font-semibold mb-3">Registered office</h5>
            <p className="text-slate-400 leading-relaxed">
              <span className="text-white font-medium">Qwikstuffs Pvt. Ltd.</span><br />
              E2, Devi Building, Metu Street,<br />
              Iyyapanthangal, Chennai 600 077<br />
              Tamil Nadu, India
            </p>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <a href="tel:+918310042593" className="hover:text-white transition-colors">+91 83100 42593</a>
            </div>
            <div className="flex items-start gap-2">
              <Receipt className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>GSTIN <span className="font-mono text-slate-300">33AFDPY2309C3ZR</span></span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Founder &amp; CEO — Yogesh Yowan</span>
            </div>
            <div className="flex items-start gap-2">
              <Linkedin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <a
                href="https://www.linkedin.com/feed/?shareActive=true"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-white transition-colors"
                data-testid="link-footer-linkedin"
              >
                LinkedIn
              </a>
            </div>
          </div>
          <div className="md:text-right space-y-3">
            <p>© {year} Qwikstuffs Pvt. Ltd. All rights reserved.</p>
            <div className="flex md:justify-end gap-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <a href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
