import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Kanban,
  Mail,
  Briefcase,
  Radar,
  Settings as SettingsIcon,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Dashboard from "@/pages/Dashboard"
import Leads from "@/pages/Leads"
import LeadDetail from "@/pages/LeadDetail"
import LeadForm from "@/pages/LeadForm"
import Pipeline from "@/pages/Pipeline"
import Outreach from "@/pages/Outreach"
import Projects from "@/pages/Projects"
import Discover from "@/pages/Discover"
import SettingsPage from "@/pages/Settings"

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/discover", label: "Discover", icon: Radar },
  { to: "/outreach", label: "Outreach", icon: Mail },
  { to: "/projects", label: "Projects", icon: Briefcase },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
]

function pageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard"
  if (pathname.startsWith("/leads/new")) return "Add Lead"
  if (pathname.match(/^\/leads\/[^/]+\/edit$/)) return "Edit Lead"
  if (pathname.match(/^\/leads\/[^/]+$/)) return "Lead Detail"
  if (pathname.startsWith("/leads")) return "Leads"
  if (pathname.startsWith("/pipeline")) return "Pipeline"
  if (pathname.startsWith("/discover")) return "Discover"
  if (pathname.startsWith("/outreach")) return "Outreach"
  if (pathname.startsWith("/projects")) return "Projects"
  if (pathname.startsWith("/settings")) return "Settings"
  return "Freelance Radar"
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r border-outline-variant bg-surface-lowest">
      <div className="flex h-16 items-center px-6">
        <span className="text-base font-semibold text-on-surface">Freelance Radar</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface",
                isActive && "bg-surface-low text-primary"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitle(location.pathname)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-outline-variant bg-background/95 px-10 backdrop-blur-sm">
      <h1 className="text-lg font-semibold text-on-surface">{title}</h1>
      <Button onClick={() => navigate("/leads/new")}>
        <Plus className="h-4 w-4" />
        Add Lead
      </Button>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex min-h-screen flex-col">
        <Topbar />
        <main className="flex-1 px-10 py-8">
          <div className="mx-auto max-w-[1200px]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/new" element={<LeadForm />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/leads/:id/edit" element={<LeadForm />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/outreach" element={<Outreach />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
