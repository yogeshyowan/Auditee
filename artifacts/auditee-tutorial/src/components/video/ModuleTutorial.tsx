import { useEffect, useState } from 'react';
import { ModuleSources } from './modules/ModuleSources';
import { ModuleInterview } from './modules/ModuleInterview';
import { ModuleRequirements } from './modules/ModuleRequirements';
import { ModuleGaps } from './modules/ModuleGaps';
import { ModuleTraceability } from './modules/ModuleTraceability';
import { ModuleCompliance } from './modules/ModuleCompliance';
import { ModuleCapa } from './modules/ModuleCapa';
import { ModuleDefects } from './modules/ModuleDefects';
import { ModuleTests } from './modules/ModuleTests';
import { ModuleReports } from './modules/ModuleReports';
import { ModuleWorkflows } from './modules/ModuleWorkflows';
import { ModuleAnalytics } from './modules/ModuleAnalytics';
import { ModuleRecurringAudits } from './modules/ModuleRecurringAudits';
import { ModuleDashboard } from './modules/ModuleDashboard';
import { ModuleLegacy } from './modules/ModuleLegacy';
import { ModulePdlc } from './modules/ModulePdlc';
import { ModuleAsk } from './modules/ModuleAsk';

const MODULES: Record<string, React.ComponentType> = {
  sources: ModuleSources,
  interview: ModuleInterview,
  requirements: ModuleRequirements,
  gaps: ModuleGaps,
  traceability: ModuleTraceability,
  compliance: ModuleCompliance,
  capa: ModuleCapa,
  defects: ModuleDefects,
  tests: ModuleTests,
  reports: ModuleReports,
  workflows: ModuleWorkflows,
  analytics: ModuleAnalytics,
  'recurring-audits': ModuleRecurringAudits,
  dashboard: ModuleDashboard,
  legacy: ModuleLegacy,
  pdlc: ModulePdlc,
  ask: ModuleAsk,
};

export function ModuleTutorial() {
  const [moduleKey, setModuleKey] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mod = params.get('module');
    if (mod && MODULES[mod]) {
      setModuleKey(mod);
    }
  }, []);

  if (!moduleKey) return null;

  const Component = MODULES[moduleKey];
  return <Component />;
}
