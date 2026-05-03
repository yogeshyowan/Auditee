import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { UpsellDialog } from "@/components/UpsellDialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider } from "@/lib/project-context";
import { useLeadCapture } from "@/lib/leadCapture";
import { useMarketingstuffs } from "@/lib/marketingstuffs";
import { useIdleTimeout } from "@/lib/useIdleTimeout";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import RoiCalculator from "@/pages/RoiCalculator";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Features from "@/pages/Features";
import AiProductDevelopment from "@/pages/AiProductDevelopment";
import AutomatedCompliance from "@/pages/AutomatedCompliance";
import MissingRequirementsAnalysis from "@/pages/MissingRequirementsAnalysis";
import TestCaseGeneration from "@/pages/TestCaseGeneration";
import AiRequirementsManagement from "@/pages/AiRequirementsManagement";
import RequirementsManagement from "@/pages/RequirementsManagement";
import BrdGeneration from "@/pages/BrdGeneration";
import IntelligentDocumentAnalysis from "@/pages/IntelligentDocumentAnalysis";
import RequirementsLinkedTestCases from "@/pages/RequirementsLinkedTestCases";
import AiForHealthcare from "@/pages/AiForHealthcare";
import AiForFinance from "@/pages/AiForFinance";
import AiForAutomotive from "@/pages/AiForAutomotive";
import AiForTelecom from "@/pages/AiForTelecom";
import ForCpo from "@/pages/ForCpo";
import ForCto from "@/pages/ForCto";
import ForBusinessAnalyst from "@/pages/ForBusinessAnalyst";
import ForQaCompliance from "@/pages/ForQaCompliance";
import DemoVideos from "@/pages/DemoVideos";
import Faqs from "@/pages/Faqs";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";
import { AppLayout } from "@/components/layout/AppLayout";

// App Pages
import Dashboard from "@/pages/app/Dashboard";
import Requirements from "@/pages/app/Requirements";
import Traceability from "@/pages/app/Traceability";
import Compliance from "@/pages/app/Compliance";
import ComplianceDetail from "@/pages/app/ComplianceDetail";
import CustomStandards from "@/pages/app/CustomStandards";
import Pdlc from "@/pages/app/Pdlc";
import Legacy from "@/pages/app/Legacy";
import Activity from "@/pages/app/Activity";
import Ask from "@/pages/app/Ask";
import Capa from "@/pages/app/Capa";
import Reports from "@/pages/app/Reports";
import TestCases from "@/pages/app/TestCases";
import Workflows from "@/pages/app/Workflows";
import Analytics from "@/pages/app/Analytics";
import RecurringAudits from "@/pages/app/RecurringAudits";
import Sources from "@/pages/app/Sources";
import Defects from "@/pages/app/Defects";
import Gaps from "@/pages/app/Gaps";
import Interview from "@/pages/app/Interview";
import Billing from "@/pages/app/Billing";
import Templates from "@/pages/app/Templates";
import AuditLogs from "@/pages/app/AuditLogs";
import AdminLeads from "@/pages/app/AdminLeads";
import Sso from "@/pages/app/Sso";
import ProjectMembers from "@/pages/app/ProjectMembers";
import Security from "@/pages/Security";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: typeof window !== "undefined" ? `${window.location.origin}${basePath}/logo.svg` : "/logo.svg",
  },
  variables: {
    colorPrimary: "#6366f1",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0f172a",
    colorNeutral: "#e2e8f0",
    fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-slate-200 shadow-xl shadow-slate-900/5",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-display font-bold text-2xl",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50",
    socialButtonsBlockButtonText: "text-slate-900 font-medium",
    formFieldLabel: "text-slate-700 font-medium",
    formFieldInput: "bg-white border border-slate-200 text-slate-900",
    formButtonPrimary: "bg-[#6366f1] hover:bg-[#5856eb] text-white",
    footerAction: "",
    footerActionLink: "text-[#6366f1] hover:text-[#5856eb] font-semibold",
    footerActionText: "text-slate-500",
    dividerLine: "bg-slate-200",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-[#6366f1]",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-slate-700",
    alert: "border border-slate-200 bg-slate-50",
    otpCodeFieldInput: "border border-slate-200 text-slate-900",
    formFieldRow: "",
    main: "",
    logoBox: "justify-center",
    logoImage: "h-8 w-auto",
  },
};

function LeadCaptureMount() {
  useLeadCapture();
  useMarketingstuffs();
  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  return (
    <ProjectProvider>
      <AppLayout>
        <Switch>
          <Route path="/app" component={() => <Redirect to="/app/sources" />} />
          <Route path="/app/dashboard" component={Dashboard} />
          <Route path="/app/requirements" component={Requirements} />
          <Route path="/app/traceability" component={Traceability} />
          <Route path="/app/compliance" component={Compliance} />
          <Route path="/app/compliance/:id" component={ComplianceDetail} />
          <Route path="/app/standards" component={CustomStandards} />
          <Route path="/app/pdlc" component={Pdlc} />
          <Route path="/app/legacy" component={Legacy} />
          <Route path="/app/activity" component={Activity} />
          <Route path="/app/ask" component={Ask} />
          <Route path="/app/capa" component={Capa} />
          <Route path="/app/reports" component={Reports} />
          <Route path="/app/tests" component={TestCases} />
          <Route path="/app/workflows" component={Workflows} />
          <Route path="/app/analytics" component={Analytics} />
          <Route path="/app/recurring-audits" component={RecurringAudits} />
          <Route path="/app/sources" component={Sources} />
          <Route path="/app/defects" component={Defects} />
          <Route path="/app/gaps" component={Gaps} />
          <Route path="/app/interview" component={Interview} />
          <Route path="/app/billing" component={Billing} />
          <Route path="/app/templates" component={Templates} />
          <Route path="/app/audit-logs" component={AuditLogs} />
          <Route path="/app/admin/leads" component={AdminLeads} />
          <Route path="/app/members" component={ProjectMembers} />
          <Route path="/app/sso" component={Sso} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ProjectProvider>
  );
}

/**
 * Mounts the idle-timeout watcher only when a user is signed in.
 * Required by HIPAA § 164.312(a)(2)(iii) and PCI DSS Req 8.2.8.
 * Signs out after 30 minutes of inactivity with a 2-minute warning toast.
 */
function IdleGuard() {
  useIdleTimeout(30 * 60 * 1000);
  return null;
}

function GatedAppRoutes() {
  return (
    <>
      <Show when="signed-in">
        <IdleGuard />
        <AppRoutes />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/features" component={Features} />
      <Route path="/ai-product-development" component={AiProductDevelopment} />
      <Route path="/automated-compliance" component={AutomatedCompliance} />
      <Route path="/ai-requirements-management" component={AiRequirementsManagement} />
      <Route path="/ai-requirements-generation" component={AiRequirementsManagement} />
      <Route path="/requirements-management" component={RequirementsManagement} />
      <Route path="/brd-generation" component={BrdGeneration} />
      <Route path="/intelligent-document-analysis" component={IntelligentDocumentAnalysis} />
      <Route path="/requirements-linked-test-cases" component={RequirementsLinkedTestCases} />
      <Route path="/missing-requirements-analysis" component={MissingRequirementsAnalysis} />
      <Route path="/test-case-generation" component={TestCaseGeneration} />
      <Route path="/ai-for-healthcare" component={AiForHealthcare} />
      <Route path="/ai-for-finance" component={AiForFinance} />
      <Route path="/ai-for-automotive" component={AiForAutomotive} />
      <Route path="/ai-for-telecom" component={AiForTelecom} />
      <Route path="/cpo" component={ForCpo} />
      <Route path="/cto" component={ForCto} />
      <Route path="/business-analyst" component={ForBusinessAnalyst} />
      <Route path="/qa-and-compliance" component={ForQaCompliance} />
      <Route path="/demo-videos" component={DemoVideos} />
      <Route path="/faqs" component={Faqs} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/terms-of-services" component={TermsOfService} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/roi-calculator" component={RoiCalculator} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/security" component={Security} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/app" component={() => <Redirect to="/app/sources" />} />
      <Route path="/app/*" component={GatedAppRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return (
      <div className="p-8 text-center text-red-600">
        Missing VITE_CLERK_PUBLISHABLE_KEY. Authentication is not configured.
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome to Auditee",
            subtitle: "Sign in to your AI-native PDLC workspace",
          },
        },
        signUp: {
          start: {
            title: "Create your Auditee account",
            subtitle: "Start your free workspace in seconds",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <LeadCaptureMount />
        <TooltipProvider>
          <Router />
          <Toaster />
          <UpsellDialog />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
