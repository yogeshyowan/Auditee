import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  ListChecks, 
  Network, 
  ShieldCheck, 
  FastForward, 
  Database, 
  Activity,
  User,
  ChevronDown,
  Sparkles,
  FileText,
  AlertTriangle,
  Bug,
  Workflow,
  BarChart3,
  CalendarClock,
  FolderInput,
  MessagesSquare,
  CreditCard,
  KeyRound,
  FileSearch,
  Plus,
  Users,
  Beaker,
  FileBadge2,
  Compass,
  Mailbox,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { TutorialDrawer } from "@/components/TutorialDrawer";
import { InlineTutorialPanel } from "@/components/InlineTutorialPanel";
import { NotificationBell } from "@/components/NotificationBell";
import { AskAuditeeFloater } from "@/components/AskAuditeeFloater";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { useProjectContext } from "@/lib/project-context";
import { startTour, maybeAutoStartTour } from "@/lib/tour";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Project Sources is the landing page (top of the nav) since nothing else
// works without sources connected. Dashboard is now the last item — it's a
// roll-up view that only becomes useful once data has been ingested.
// Ask Auditee lives as a floating button on every page (see AskAuditeeFloater),
// so it's intentionally not in the sidebar list.
const NAV_ITEMS = [
  { href: "/app/sources", label: "Project Sources", icon: FolderInput },
  { href: "/app/interview", label: "Smart Interview", icon: MessagesSquare },
  { href: "/app/requirements", label: "Requirements", icon: ListChecks },
  { href: "/app/gaps", label: "Gap Detection", icon: AlertTriangle },
  { href: "/app/traceability", label: "Traceability Graph", icon: Network },
  { href: "/app/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/app/standards", label: "Custom Standards", icon: FileBadge2 },
  { href: "/app/capa", label: "CAPA Actions", icon: AlertTriangle },
  { href: "/app/defects", label: "Defects", icon: Bug },
  { href: "/app/tests", label: "Test Cases", icon: Beaker },
  { href: "/app/reports", label: "AI Reports", icon: FileText },
  { href: "/app/workflows", label: "Workflows", icon: Workflow },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/recurring-audits", label: "Recurring Audits", icon: CalendarClock },
  { href: "/app/pdlc", label: "PDLC Pipeline", icon: FastForward },
  { href: "/app/legacy", label: "Legacy Modernization", icon: Database },
  { href: "/app/activity", label: "Activity", icon: Activity },
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/billing", label: "Billing & Team", icon: CreditCard },
  { href: "/app/templates", label: "Company Template", icon: FileBadge2 },
  { href: "/app/members", label: "Project Members", icon: Users },
  { href: "/app/audit-logs", label: "Audit Log", icon: FileSearch },
  { href: "/app/sso", label: "SSO & Security", icon: KeyRound },
  { href: "/app/enterprise", label: "Enterprise Settings", icon: Building2 },
];

// Internal-admin-only nav items. These are gated by both the workspace
// `owner` role AND the LEAD_ADMIN_EMAILS allowlist on the API; we hide the
// link entirely when the API says the signed-in user is not an admin so the
// rest of the team isn't shown a link that just shows them a 403.
const ADMIN_NAV_ITEMS = [
  { href: "/app/admin/leads", label: "Captured Leads", icon: Mailbox },
];

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

// Maps /app/<slug> → tutorial module key. Routes not listed here have no tutorial.
const ROUTE_TO_MODULE: Record<string, string> = {
  "/app/sources": "sources",
  "/app/interview": "interview",
  "/app/requirements": "requirements",
  "/app/gaps": "gaps",
  "/app/traceability": "traceability",
  "/app/compliance": "compliance",
  "/app/standards": "compliance",
  "/app/capa": "capa",
  "/app/defects": "defects",
  "/app/tests": "tests",
  "/app/reports": "reports",
  "/app/workflows": "workflows",
  "/app/analytics": "analytics",
  "/app/recurring-audits": "recurring-audits",
  "/app/dashboard": "dashboard",
};

function getModuleForRoute(loc: string): string | null {
  // Exact match first
  if (ROUTE_TO_MODULE[loc]) return ROUTE_TO_MODULE[loc];
  // Prefix match for dynamic routes like /app/compliance/:id
  for (const [prefix, mod] of Object.entries(ROUTE_TO_MODULE)) {
    if (loc.startsWith(prefix + "/")) return mod;
  }
  return null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { projectId, setProjectId, connectedProjects, allProjects, effectiveRole } = useProjectContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const tutorialModule = getModuleForRoute(location);
  const { getToken, isLoaded: isAuthLoaded } = useAuth();

  const adminCheck = useQuery<{ isAdmin: boolean }>({
    queryKey: ["leads", "admin-check"],
    enabled: isAuthLoaded,
    queryFn: async () => {
      const token = await getToken();
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch(`${apiBase}/leads/admin/me`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) return { isAdmin: false };
      return res.json();
    },
    retry: false,
  });

  const navItems = adminCheck.data?.isAdmin
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS;

  // Tell search engines never to index the signed-in app — these pages are
  // private project workspaces. robots.txt covers most crawlers; this meta
  // tag is the per-page belt-and-braces signal for any that ignore it.
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(tag);
    return () => {
      document.head.removeChild(tag);
    };
  }, []);

  useEffect(() => {
    maybeAutoStartTour(navigate);
  }, [navigate]);

  // Look up the active project across ALL projects (connected or not) so
  // freshly-created projects with 0 sources still appear in the switcher button.
  const currentProject =
    allProjects.find((p) => p.id === projectId) ?? connectedProjects[0] ?? allProjects[0];
  const ownProjects = allProjects.filter((p) => !p.isDemo);
  const demoProjects = allProjects.filter((p) => p.isDemo);
  const unconnected = ownProjects.filter((p) => p.sourceCount === 0);

  return (
    <div className="min-h-[100dvh] flex bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="p-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-1.5 font-display font-bold text-2xl tracking-tight text-slate-950 mb-6">
            <span className="text-primary">Auditee</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors"
              data-testid="project-switcher"
            >
              <span className="truncate">
                {currentProject?.name ?? (connectedProjects.length === 0 ? "No connected projects" : "Select project")}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] max-h-[70vh] overflow-y-auto">
              {/* ── Your projects ── */}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                Your projects
              </DropdownMenuLabel>
              {connectedProjects.length === 0 && unconnected.length === 0 ? (
                <div className="px-2 py-3 text-xs text-slate-500">
                  None yet. Go to{" "}
                  <Link href="/app/sources" className="text-primary underline">
                    Project Sources
                  </Link>{" "}
                  to connect a repository or upload files.
                </div>
              ) : (
                <>
                  {connectedProjects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setProjectId(project.id)}
                      className={projectId === project.id ? "bg-slate-100 font-semibold" : ""}
                      data-testid={`project-option-${project.id}`}
                    >
                      <span className="flex-1 truncate">{project.name}</span>
                      <Badge variant="outline" className="text-[10px] ml-2">
                        {project.sourceCount} src
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                  {unconnected.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setProjectId(project.id)}
                      className={`opacity-80 ${projectId === project.id ? "bg-slate-100 font-semibold" : ""}`}
                      title="No sources yet — switch here, then connect a source from the Project Sources page."
                      data-testid={`project-option-${project.id}`}
                    >
                      <span className="flex-1 truncate">{project.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">no sources</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                className="text-primary font-medium"
                data-testid="create-project-trigger"
              >
                <Plus className="h-4 w-4 mr-2" />
                New project
              </DropdownMenuItem>

              {/* ── Demo / example projects ── */}
              {demoProjects.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">
                    Example projects (read-only)
                  </DropdownMenuLabel>
                  {demoProjects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setProjectId(project.id)}
                      className={`${projectId === project.id ? "bg-slate-100 font-semibold" : ""}`}
                      data-testid={`project-option-${project.id}`}
                    >
                      <span className="flex-1 truncate text-slate-700">{project.name}</span>
                      <Badge className="text-[10px] ml-2 bg-violet-100 text-violet-700 border-0 shrink-0">
                        demo
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {effectiveRole && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge
                className={
                  "text-[10px] uppercase tracking-wide " +
                  (effectiveRole === "manager"
                    ? "bg-violet-100 text-violet-800"
                    : effectiveRole === "developer"
                      ? "bg-emerald-100 text-emerald-800"
                      : effectiveRole === "reviewer"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-200 text-slate-800")
                }
                data-testid="effective-role-badge"
              >
                {effectiveRole}
              </Badge>
              <span className="text-[10px] text-slate-500">your role</span>
            </div>
          )}
          <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const tourKey = `nav-${item.href.replace("/app/", "")}`;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                data-tour={tourKey}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">Avery Kim</span>
              <span className="text-xs text-slate-500">Platform Lead</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => startTour(navigate)}
            data-testid="button-take-tour"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary px-3 py-1.5 rounded-full border border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            Take a tour
          </button>
          <NotificationBell recipient="avery.kim" />
        </div>

        {/* Inline tutorial panel — visible on every module page, collapsed by default */}
        <InlineTutorialPanel
          module={tutorialModule}
          onOpenFullscreen={() => setTutorialOpen(true)}
        />

        <div className="p-6 flex-1">{children}</div>
      </main>

      <AskAuditeeFloater />

      <TutorialDrawer
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        module={tutorialModule}
      />
    </div>
  );
}
