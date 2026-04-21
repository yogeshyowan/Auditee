import { Link, useLocation } from "wouter";
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
  Workflow,
  BarChart3,
  CalendarClock
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useListProjects } from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/ask", label: "Ask Eltegra", icon: Sparkles },
  { href: "/app/requirements", label: "Requirements", icon: ListChecks },
  { href: "/app/traceability", label: "Traceability Graph", icon: Network },
  { href: "/app/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/app/capa", label: "CAPA Actions", icon: AlertTriangle },
  { href: "/app/reports", label: "AI Reports", icon: FileText },
  { href: "/app/workflows", label: "Workflows", icon: Workflow },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/recurring-audits", label: "Recurring Audits", icon: CalendarClock },
  { href: "/app/pdlc", label: "PDLC Pipeline", icon: FastForward },
  { href: "/app/legacy", label: "Legacy Modernization", icon: Database },
  { href: "/app/activity", label: "Activity", icon: Activity },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { projectId, setProjectId } = useProjectContext();
  const { data: projects } = useListProjects();

  const currentProject = projects?.find(p => p.id === projectId) || projects?.[0];

  return (
    <div className="min-h-[100dvh] flex bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="p-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-1.5 font-display font-bold text-2xl tracking-tight text-slate-950 mb-6">
            Eltegra<span className="text-primary">AI</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors">
              <span className="truncate">{currentProject?.name || "Select Project"}</span>
              <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[206px]">
              {projects?.map(project => (
                <DropdownMenuItem 
                  key={project.id} 
                  onClick={() => setProjectId(project.id)}
                  className={projectId === project.id ? "bg-slate-100 font-semibold" : ""}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
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
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-2 flex items-center justify-end">
          <NotificationBell recipient="avery.kim" />
        </div>
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
