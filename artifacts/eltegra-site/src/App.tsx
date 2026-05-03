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
import Roadmap from "@/pages/Roadmap";
import Careers from "@/pages/Careers";
import CookiePolicy from "@/pages/CookiePolicy";
import Sla from "@/pages/Sla";
import Newsroom from "@/pages/Newsroom";
import BrandKit from "@/pages/BrandKit";
import Dpa from "@/pages/Dpa";
import SubProcessors from "@/pages/SubProcessors";
import Aup from "@/pages/Aup";
import Webinars from "@/pages/Webinars";
import HelpCenter from "@/pages/HelpCenter";
import Migrations from "@/pages/Migrations";
import Affiliates from "@/pages/Affiliates";
import FreeTools from "@/pages/FreeTools";
import CompareHub from "@/pages/CompareHub";
import IndustriesHub from "@/pages/IndustriesHub";
import ForStartups from "@/pages/ForStartups";
import ForEnterprise from "@/pages/ForEnterprise";
import TemplatesPage from "@/pages/Templates";
import Customers from "@/pages/Customers";
import StandardsHub from "@/pages/StandardsHub";
import Teams from "@/pages/Teams";
import VulnerabilityDisclosure from "@/pages/VulnerabilityDisclosure";
import HtmlSitemap from "@/pages/HtmlSitemap";
import RefundPolicy from "@/pages/RefundPolicy";
import CancellationPolicy from "@/pages/CancellationPolicy";
import ShippingPolicy from "@/pages/ShippingPolicy";
import Accessibility from "@/pages/Accessibility";
import Community from "@/pages/Community";
import Aspice from "@/pages/Aspice";
import Iec62304 from "@/pages/Iec62304";
import FdaQmsr from "@/pages/FdaQmsr";
import IntegrationJira from "@/pages/IntegrationJira";
import IntegrationAzureDevOps from "@/pages/IntegrationAzureDevOps";
import Iso26262 from "@/pages/Iso26262";
import Iso21434 from "@/pages/Iso21434";
import DpdpAct from "@/pages/DpdpAct";
import IntegrationGitHub from "@/pages/IntegrationGitHub";
import IntegrationSlack from "@/pages/IntegrationSlack";
import Gdpr from "@/pages/Gdpr";
import Soc2 from "@/pages/Soc2";
import Iso27001 from "@/pages/Iso27001";
import IntegrationGitLab from "@/pages/IntegrationGitLab";
import IntegrationConfluence from "@/pages/IntegrationConfluence";
import Hipaa from "@/pages/Hipaa";
import Dora from "@/pages/Dora";
import EuAiAct from "@/pages/EuAiAct";
import IntegrationServiceNow from "@/pages/IntegrationServiceNow";
import IntegrationMicrosoftTeams from "@/pages/IntegrationMicrosoftTeams";
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
import CompareDoors from "@/pages/CompareDoors";
import CompareJama from "@/pages/CompareJama";
import ComparePolarion from "@/pages/ComparePolarion";
import Integrations from "@/pages/Integrations";
import Glossary from "@/pages/Glossary";
import CaseStudies from "@/pages/CaseStudies";
import TrustCenter from "@/pages/TrustCenter";
import Changelog from "@/pages/Changelog";
import UseCases from "@/pages/UseCases";
import Whitepapers from "@/pages/Whitepapers";
import Developers from "@/pages/Developers";
import Partners from "@/pages/Partners";
import Status from "@/pages/Status";
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
import EnterpriseSettings from "@/pages/app/EnterpriseSettings";
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
          <Route path="/app/enterprise" component={EnterpriseSettings} />
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
      <Route path="/compare/doors" component={CompareDoors} />
      <Route path="/compare/ibm-doors" component={CompareDoors} />
      <Route path="/compare/jama" component={CompareJama} />
      <Route path="/compare/jama-connect" component={CompareJama} />
      <Route path="/compare/polarion" component={ComparePolarion} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/glossary" component={Glossary} />
      <Route path="/case-studies" component={CaseStudies} />
      <Route path="/customers" component={CaseStudies} />
      <Route path="/trust" component={TrustCenter} />
      <Route path="/trust-center" component={TrustCenter} />
      <Route path="/changelog" component={Changelog} />
      <Route path="/whats-new" component={Changelog} />
      <Route path="/use-cases" component={UseCases} />
      <Route path="/solutions" component={UseCases} />
      <Route path="/whitepapers" component={Whitepapers} />
      <Route path="/resources" component={Whitepapers} />
      <Route path="/developers" component={Developers} />
      <Route path="/docs" component={Developers} />
      <Route path="/partners" component={Partners} />
      <Route path="/partner-program" component={Partners} />
      <Route path="/status" component={Status} />
      <Route path="/uptime" component={Status} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/roi-calculator" component={RoiCalculator} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/careers" component={Careers} />
      <Route path="/jobs" component={Careers} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path="/sla" component={Sla} />
      <Route path="/service-level-agreement" component={Sla} />
      <Route path="/newsroom" component={Newsroom} />
      <Route path="/press" component={Newsroom} />
      <Route path="/brand" component={BrandKit} />
      <Route path="/brand-kit" component={BrandKit} />
      <Route path="/press-kit" component={BrandKit} />
      <Route path="/dpa" component={Dpa} />
      <Route path="/data-processing-addendum" component={Dpa} />
      <Route path="/sub-processors" component={SubProcessors} />
      <Route path="/subprocessors" component={SubProcessors} />
      <Route path="/aup" component={Aup} />
      <Route path="/acceptable-use" component={Aup} />
      <Route path="/acceptable-use-policy" component={Aup} />
      <Route path="/webinars" component={Webinars} />
      <Route path="/events" component={Webinars} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/support" component={HelpCenter} />
      <Route path="/migrations" component={Migrations} />
      <Route path="/migrate" component={Migrations} />
      <Route path="/affiliates" component={Affiliates} />
      <Route path="/affiliate-program" component={Affiliates} />
      <Route path="/referral" component={Affiliates} />
      <Route path="/free-tools" component={FreeTools} />
      <Route path="/tools" component={FreeTools} />
      <Route path="/compare" component={CompareHub} />
      <Route path="/comparisons" component={CompareHub} />
      <Route path="/alternatives" component={CompareHub} />
      <Route path="/industries" component={IndustriesHub} />
      <Route path="/sectors" component={IndustriesHub} />
      <Route path="/for-startups" component={ForStartups} />
      <Route path="/startups" component={ForStartups} />
      <Route path="/for-enterprise" component={ForEnterprise} />
      <Route path="/enterprise" component={ForEnterprise} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/template-library" component={TemplatesPage} />
      <Route path="/customers" component={Customers} />
      <Route path="/logos" component={Customers} />
      <Route path="/standards" component={StandardsHub} />
      <Route path="/standards-library" component={StandardsHub} />
      <Route path="/teams" component={Teams} />
      <Route path="/roles" component={Teams} />
      <Route path="/vdp" component={VulnerabilityDisclosure} />
      <Route path="/vulnerability-disclosure" component={VulnerabilityDisclosure} />
      <Route path="/security/disclosure" component={VulnerabilityDisclosure} />
      <Route path="/sitemap" component={HtmlSitemap} />
      <Route path="/site-map" component={HtmlSitemap} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/refunds" component={RefundPolicy} />
      <Route path="/cancellation-policy" component={CancellationPolicy} />
      <Route path="/cancellation" component={CancellationPolicy} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      <Route path="/shipping" component={ShippingPolicy} />
      <Route path="/delivery-policy" component={ShippingPolicy} />
      <Route path="/accessibility" component={Accessibility} />
      <Route path="/a11y" component={Accessibility} />
      <Route path="/community" component={Community} />
      <Route path="/slack" component={Community} />
      <Route path="/aspice" component={Aspice} />
      <Route path="/aspice-4-0" component={Aspice} />
      <Route path="/aspice-compliance" component={Aspice} />
      <Route path="/automotive-spice" component={Aspice} />
      <Route path="/iec-62304" component={Iec62304} />
      <Route path="/iec62304" component={Iec62304} />
      <Route path="/iec-62304-compliance" component={Iec62304} />
      <Route path="/fda-qmsr" component={FdaQmsr} />
      <Route path="/qmsr" component={FdaQmsr} />
      <Route path="/21-cfr-820" component={FdaQmsr} />
      <Route path="/integrations/jira" component={IntegrationJira} />
      <Route path="/jira-integration" component={IntegrationJira} />
      <Route path="/integrations/azure-devops" component={IntegrationAzureDevOps} />
      <Route path="/integrations/ado" component={IntegrationAzureDevOps} />
      <Route path="/azure-devops-integration" component={IntegrationAzureDevOps} />
      <Route path="/iso-26262" component={Iso26262} />
      <Route path="/iso26262" component={Iso26262} />
      <Route path="/functional-safety" component={Iso26262} />
      <Route path="/iso-21434" component={Iso21434} />
      <Route path="/iso21434" component={Iso21434} />
      <Route path="/automotive-cybersecurity" component={Iso21434} />
      <Route path="/un-r155" component={Iso21434} />
      <Route path="/dpdp-act" component={DpdpAct} />
      <Route path="/dpdp" component={DpdpAct} />
      <Route path="/india-data-protection" component={DpdpAct} />
      <Route path="/integrations/github" component={IntegrationGitHub} />
      <Route path="/github-integration" component={IntegrationGitHub} />
      <Route path="/integrations/slack" component={IntegrationSlack} />
      <Route path="/slack-integration" component={IntegrationSlack} />
      <Route path="/gdpr" component={Gdpr} />
      <Route path="/eu-gdpr" component={Gdpr} />
      <Route path="/uk-gdpr" component={Gdpr} />
      <Route path="/soc-2" component={Soc2} />
      <Route path="/soc2" component={Soc2} />
      <Route path="/soc-2-type-ii" component={Soc2} />
      <Route path="/iso-27001" component={Iso27001} />
      <Route path="/iso27001" component={Iso27001} />
      <Route path="/isms" component={Iso27001} />
      <Route path="/integrations/gitlab" component={IntegrationGitLab} />
      <Route path="/gitlab-integration" component={IntegrationGitLab} />
      <Route path="/integrations/confluence" component={IntegrationConfluence} />
      <Route path="/confluence-integration" component={IntegrationConfluence} />
      <Route path="/hipaa" component={Hipaa} />
      <Route path="/hipaa-compliance" component={Hipaa} />
      <Route path="/dora" component={Dora} />
      <Route path="/dora-regulation" component={Dora} />
      <Route path="/digital-operational-resilience-act" component={Dora} />
      <Route path="/eu-ai-act" component={EuAiAct} />
      <Route path="/ai-act" component={EuAiAct} />
      <Route path="/eu-2024-1689" component={EuAiAct} />
      <Route path="/integrations/servicenow" component={IntegrationServiceNow} />
      <Route path="/servicenow-integration" component={IntegrationServiceNow} />
      <Route path="/integrations/microsoft-teams" component={IntegrationMicrosoftTeams} />
      <Route path="/integrations/teams" component={IntegrationMicrosoftTeams} />
      <Route path="/microsoft-teams-integration" component={IntegrationMicrosoftTeams} />
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
