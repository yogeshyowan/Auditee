import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider } from "@/lib/project-context";

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
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import { AppLayout } from "@/components/layout/AppLayout";

// App Pages
import Dashboard from "@/pages/app/Dashboard";
import Requirements from "@/pages/app/Requirements";
import Traceability from "@/pages/app/Traceability";
import Compliance from "@/pages/app/Compliance";
import ComplianceDetail from "@/pages/app/ComplianceDetail";
import Pdlc from "@/pages/app/Pdlc";
import Legacy from "@/pages/app/Legacy";
import Activity from "@/pages/app/Activity";
import Ask from "@/pages/app/Ask";
import Capa from "@/pages/app/Capa";
import Reports from "@/pages/app/Reports";
import Workflows from "@/pages/app/Workflows";
import Analytics from "@/pages/app/Analytics";
import RecurringAudits from "@/pages/app/RecurringAudits";
import Sources from "@/pages/app/Sources";
import Defects from "@/pages/app/Defects";
import Gaps from "@/pages/app/Gaps";
import Interview from "@/pages/app/Interview";

const queryClient = new QueryClient();

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
          <Route path="/app/pdlc" component={Pdlc} />
          <Route path="/app/legacy" component={Legacy} />
          <Route path="/app/activity" component={Activity} />
          <Route path="/app/ask" component={Ask} />
          <Route path="/app/capa" component={Capa} />
          <Route path="/app/reports" component={Reports} />
          <Route path="/app/workflows" component={Workflows} />
          <Route path="/app/analytics" component={Analytics} />
          <Route path="/app/recurring-audits" component={RecurringAudits} />
          <Route path="/app/sources" component={Sources} />
          <Route path="/app/defects" component={Defects} />
          <Route path="/app/gaps" component={Gaps} />
          <Route path="/app/interview" component={Interview} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ProjectProvider>
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
      <Route path="/missing-requirements-analysis" component={MissingRequirementsAnalysis} />
      <Route path="/test-case-generation" component={TestCaseGeneration} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/roi-calculator" component={RoiCalculator} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/app" component={() => <Redirect to="/app/sources" />} />
      <Route path="/app/*" component={AppRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
