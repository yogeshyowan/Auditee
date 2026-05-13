import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, Show, useClerk } from "@clerk/react";
import { ClerkLoadGate } from "@/components/ClerkLoadGate";
import { AliasRoute } from "@/components/AliasRoute";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { UpsellDialog } from "@/components/UpsellDialog";
import { ChatWidget } from "@/components/ChatWidget";
import { TawkToWidget } from "@/components/TawkToWidget";
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
import Msa from "@/pages/Msa";
import Baa from "@/pages/Baa";
import SecurityWhitepaper from "@/pages/SecurityWhitepaper";
import PentestSummary from "@/pages/PentestSummary";
import SecurityQuestionnaire from "@/pages/SecurityQuestionnaire";
import Soc2Report from "@/pages/Soc2Report";
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
import DemoVideoDetail from "@/pages/DemoVideoDetail";
import PromptLibrary from "@/pages/PromptLibrary";
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
import Completeness from "@/pages/app/Completeness";
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
          <Route path="/app/completeness" component={Completeness} />
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
    <ClerkLoadGate>
      <Show when="signed-in">
        <IdleGuard />
        <AppRoutes />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </ClerkLoadGate>
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
      <AliasRoute path="/ai-requirements-generation" canonical="/ai-requirements-management" component={AiRequirementsManagement} />
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
      <Route path="/demo-videos/:slug" component={DemoVideoDetail} />
      <Route path="/prompt-library" component={PromptLibrary} />
      <Route path="/faqs" component={Faqs} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <AliasRoute path="/terms-of-services" canonical="/terms-of-service" component={TermsOfService} />
      <Route path="/compare/doors" component={CompareDoors} />
      <AliasRoute path="/compare/ibm-doors" canonical="/compare/doors" component={CompareDoors} />
      <Route path="/compare/jama" component={CompareJama} />
      <AliasRoute path="/compare/jama-connect" canonical="/compare/jama" component={CompareJama} />
      <Route path="/compare/polarion" component={ComparePolarion} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/glossary" component={Glossary} />
      <Route path="/case-studies" component={CaseStudies} />
      <AliasRoute path="/customers" canonical="/case-studies" component={CaseStudies} />
      <Route path="/trust" component={TrustCenter} />
      <AliasRoute path="/trust-center" canonical="/trust" component={TrustCenter} />
      <Route path="/changelog" component={Changelog} />
      <AliasRoute path="/whats-new" canonical="/changelog" component={Changelog} />
      <Route path="/use-cases" component={UseCases} />
      <AliasRoute path="/solutions" canonical="/use-cases" component={UseCases} />
      <Route path="/whitepapers" component={Whitepapers} />
      <AliasRoute path="/resources" canonical="/whitepapers" component={Whitepapers} />
      <Route path="/developers" component={Developers} />
      <AliasRoute path="/docs" canonical="/developers" component={Developers} />
      <Route path="/partners" component={Partners} />
      <AliasRoute path="/partner-program" canonical="/partners" component={Partners} />
      <Route path="/status" component={Status} />
      <AliasRoute path="/uptime" canonical="/status" component={Status} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/roi-calculator" component={RoiCalculator} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/careers" component={Careers} />
      <AliasRoute path="/jobs" canonical="/careers" component={Careers} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <AliasRoute path="/cookies" canonical="/cookie-policy" component={CookiePolicy} />
      <Route path="/sla" component={Sla} />
      <AliasRoute path="/service-level-agreement" canonical="/sla" component={Sla} />
      <Route path="/newsroom" component={Newsroom} />
      <AliasRoute path="/press" canonical="/newsroom" component={Newsroom} />
      <Route path="/brand" component={BrandKit} />
      <AliasRoute path="/brand-kit" canonical="/brand" component={BrandKit} />
      <AliasRoute path="/press-kit" canonical="/brand" component={BrandKit} />
      <Route path="/dpa" component={Dpa} />
      <AliasRoute path="/data-processing-addendum" canonical="/dpa" component={Dpa} />
      <Route path="/msa" component={Msa} />
      <AliasRoute path="/master-services-agreement" canonical="/msa" component={Msa} />
      <Route path="/baa" component={Baa} />
      <AliasRoute path="/business-associate-agreement" canonical="/baa" component={Baa} />
      <Route path="/security-whitepaper" component={SecurityWhitepaper} />
      <AliasRoute path="/whitepaper" canonical="/security-whitepaper" component={SecurityWhitepaper} />
      <Route path="/pentest" component={PentestSummary} />
      <AliasRoute path="/penetration-test" canonical="/pentest" component={PentestSummary} />
      <Route path="/security-questionnaire" component={SecurityQuestionnaire} />
      <AliasRoute path="/caiq" canonical="/security-questionnaire" component={SecurityQuestionnaire} />
      <AliasRoute path="/sig" canonical="/security-questionnaire" component={SecurityQuestionnaire} />
      <Route path="/soc2" component={Soc2Report} />
      <AliasRoute path="/soc-2" canonical="/soc2" component={Soc2Report} />
      <AliasRoute path="/soc2-report" canonical="/soc2" component={Soc2Report} />
      <Route path="/sub-processors" component={SubProcessors} />
      <AliasRoute path="/subprocessors" canonical="/sub-processors" component={SubProcessors} />
      <Route path="/aup" component={Aup} />
      <AliasRoute path="/acceptable-use" canonical="/aup" component={Aup} />
      <AliasRoute path="/acceptable-use-policy" canonical="/aup" component={Aup} />
      <Route path="/webinars" component={Webinars} />
      <AliasRoute path="/events" canonical="/webinars" component={Webinars} />
      <Route path="/help" component={HelpCenter} />
      <AliasRoute path="/help-center" canonical="/help" component={HelpCenter} />
      <AliasRoute path="/support" canonical="/help" component={HelpCenter} />
      <Route path="/migrations" component={Migrations} />
      <AliasRoute path="/migrate" canonical="/migrations" component={Migrations} />
      <Route path="/affiliates" component={Affiliates} />
      <AliasRoute path="/affiliate-program" canonical="/affiliates" component={Affiliates} />
      <AliasRoute path="/referral" canonical="/affiliates" component={Affiliates} />
      <Route path="/free-tools" component={FreeTools} />
      <AliasRoute path="/tools" canonical="/free-tools" component={FreeTools} />
      <Route path="/compare" component={CompareHub} />
      <AliasRoute path="/comparisons" canonical="/compare" component={CompareHub} />
      <AliasRoute path="/alternatives" canonical="/compare" component={CompareHub} />
      <Route path="/industries" component={IndustriesHub} />
      <AliasRoute path="/sectors" canonical="/industries" component={IndustriesHub} />
      <Route path="/for-startups" component={ForStartups} />
      <AliasRoute path="/startups" canonical="/for-startups" component={ForStartups} />
      <Route path="/for-enterprise" component={ForEnterprise} />
      <AliasRoute path="/enterprise" canonical="/for-enterprise" component={ForEnterprise} />
      <Route path="/templates" component={TemplatesPage} />
      <AliasRoute path="/template-library" canonical="/templates" component={TemplatesPage} />
      <Route path="/customers" component={Customers} />
      <AliasRoute path="/logos" canonical="/customers" component={Customers} />
      <Route path="/standards" component={StandardsHub} />
      <AliasRoute path="/standards-library" canonical="/standards" component={StandardsHub} />
      <Route path="/teams" component={Teams} />
      <AliasRoute path="/roles" canonical="/teams" component={Teams} />
      <Route path="/vdp" component={VulnerabilityDisclosure} />
      <AliasRoute path="/vulnerability-disclosure" canonical="/vdp" component={VulnerabilityDisclosure} />
      <AliasRoute path="/security/disclosure" canonical="/vdp" component={VulnerabilityDisclosure} />
      <Route path="/sitemap" component={HtmlSitemap} />
      <AliasRoute path="/site-map" canonical="/sitemap" component={HtmlSitemap} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <AliasRoute path="/refunds" canonical="/refund-policy" component={RefundPolicy} />
      <Route path="/cancellation-policy" component={CancellationPolicy} />
      <AliasRoute path="/cancellation" canonical="/cancellation-policy" component={CancellationPolicy} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      <AliasRoute path="/shipping" canonical="/shipping-policy" component={ShippingPolicy} />
      <AliasRoute path="/delivery-policy" canonical="/shipping-policy" component={ShippingPolicy} />
      <Route path="/accessibility" component={Accessibility} />
      <AliasRoute path="/a11y" canonical="/accessibility" component={Accessibility} />
      <Route path="/community" component={Community} />
      <AliasRoute path="/slack" canonical="/community" component={Community} />
      <Route path="/aspice" component={Aspice} />
      <AliasRoute path="/aspice-4-0" canonical="/aspice" component={Aspice} />
      <AliasRoute path="/aspice-compliance" canonical="/aspice" component={Aspice} />
      <AliasRoute path="/automotive-spice" canonical="/aspice" component={Aspice} />
      <Route path="/iec-62304" component={Iec62304} />
      <AliasRoute path="/iec62304" canonical="/iec-62304" component={Iec62304} />
      <AliasRoute path="/iec-62304-compliance" canonical="/iec-62304" component={Iec62304} />
      <Route path="/fda-qmsr" component={FdaQmsr} />
      <AliasRoute path="/qmsr" canonical="/fda-qmsr" component={FdaQmsr} />
      <AliasRoute path="/21-cfr-820" canonical="/fda-qmsr" component={FdaQmsr} />
      <Route path="/integrations/jira" component={IntegrationJira} />
      <AliasRoute path="/jira-integration" canonical="/integrations/jira" component={IntegrationJira} />
      <Route path="/integrations/azure-devops" component={IntegrationAzureDevOps} />
      <AliasRoute path="/integrations/ado" canonical="/integrations/azure-devops" component={IntegrationAzureDevOps} />
      <AliasRoute path="/azure-devops-integration" canonical="/integrations/azure-devops" component={IntegrationAzureDevOps} />
      <Route path="/iso-26262" component={Iso26262} />
      <AliasRoute path="/iso26262" canonical="/iso-26262" component={Iso26262} />
      <AliasRoute path="/functional-safety" canonical="/iso-26262" component={Iso26262} />
      <Route path="/iso-21434" component={Iso21434} />
      <AliasRoute path="/iso21434" canonical="/iso-21434" component={Iso21434} />
      <AliasRoute path="/automotive-cybersecurity" canonical="/iso-21434" component={Iso21434} />
      <AliasRoute path="/un-r155" canonical="/iso-21434" component={Iso21434} />
      <Route path="/dpdp-act" component={DpdpAct} />
      <AliasRoute path="/dpdp" canonical="/dpdp-act" component={DpdpAct} />
      <AliasRoute path="/india-data-protection" canonical="/dpdp-act" component={DpdpAct} />
      <Route path="/integrations/github" component={IntegrationGitHub} />
      <AliasRoute path="/github-integration" canonical="/integrations/github" component={IntegrationGitHub} />
      <Route path="/integrations/slack" component={IntegrationSlack} />
      <AliasRoute path="/slack-integration" canonical="/integrations/slack" component={IntegrationSlack} />
      <Route path="/gdpr" component={Gdpr} />
      <AliasRoute path="/eu-gdpr" canonical="/gdpr" component={Gdpr} />
      <AliasRoute path="/uk-gdpr" canonical="/gdpr" component={Gdpr} />
      <Route path="/soc-2-type-ii" component={Soc2} />
      <Route path="/iso-27001" component={Iso27001} />
      <AliasRoute path="/iso27001" canonical="/iso-27001" component={Iso27001} />
      <AliasRoute path="/isms" canonical="/iso-27001" component={Iso27001} />
      <Route path="/integrations/gitlab" component={IntegrationGitLab} />
      <AliasRoute path="/gitlab-integration" canonical="/integrations/gitlab" component={IntegrationGitLab} />
      <Route path="/integrations/confluence" component={IntegrationConfluence} />
      <AliasRoute path="/confluence-integration" canonical="/integrations/confluence" component={IntegrationConfluence} />
      <Route path="/hipaa" component={Hipaa} />
      <AliasRoute path="/hipaa-compliance" canonical="/hipaa" component={Hipaa} />
      <Route path="/dora" component={Dora} />
      <AliasRoute path="/dora-regulation" canonical="/dora" component={Dora} />
      <AliasRoute path="/digital-operational-resilience-act" canonical="/dora" component={Dora} />
      <Route path="/eu-ai-act" component={EuAiAct} />
      <AliasRoute path="/ai-act" canonical="/eu-ai-act" component={EuAiAct} />
      <AliasRoute path="/eu-2024-1689" canonical="/eu-ai-act" component={EuAiAct} />
      <Route path="/integrations/servicenow" component={IntegrationServiceNow} />
      <AliasRoute path="/servicenow-integration" canonical="/integrations/servicenow" component={IntegrationServiceNow} />
      <Route path="/integrations/microsoft-teams" component={IntegrationMicrosoftTeams} />
      <AliasRoute path="/integrations/teams" canonical="/integrations/microsoft-teams" component={IntegrationMicrosoftTeams} />
      <AliasRoute path="/microsoft-teams-integration" canonical="/integrations/microsoft-teams" component={IntegrationMicrosoftTeams} />
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
          <TawkToWidget />
          <ChatWidget />
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
