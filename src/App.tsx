import { useEffect, useState } from "react"
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Kanban,
  Mail,
  Briefcase,
  Settings as SettingsIcon,
  Plus,
  Menu,
  X,
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
import SettingsPage from "@/pages/Settings"

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
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
  if (pathname.startsWith("/outreach")) return "Outreach"
  if (pathname.startsWith("/projects")) return "Projects"
  if (pathname.startsWith("/settings")) return "Settings"
  return "Freelance Radar"
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-on-surface/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-outline-variant bg-surface-lowest transition-transform duration-200 ease-out md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <span className="text-base font-semibold text-on-surface">Freelance Radar</span>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto px-3 pb-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface",
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
    </>
  )
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitle(location.pathname)

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-outline-variant bg-background/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:px-10">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="truncate text-base font-semibold text-on-surface sm:text-lg">{title}</h1>
      </div>
      <Button onClick={() => navigate("/leads/new")} className="shrink-0" size="sm">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Lead</span>
      </Button>
    </header>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-screen flex-col md:ml-64">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-10 md:py-8">
          <div className="mx-auto max-w-[1200px]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/new" element={<LeadForm />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/leads/:id/edit" element={<LeadForm />} />
              <Route path="/pipeline" element={<Pipeline />} />
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
