"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Zap,
} from "lucide-react"

const navItems = [
  { id: "dashboard", label: "Dashboard", labelJa: "Dashboard", icon: LayoutDashboard },
  { id: "playground", label: "Playground", labelJa: "Playground", icon: MessageSquare },
  { id: "logs", label: "System Logs", labelJa: "System Logs", icon: ScrollText },
  { id: "settings", label: "Settings", labelJa: "Settings", icon: Settings },
  { id: "connectivity", label: "Connectivity", labelJa: "Connectivity", icon: Zap },
]

interface ConsoleSidebarProps {
  currentView: string
  onNavigate: (view: string) => void
}

export function ConsoleSidebar({ currentView, onNavigate }: ConsoleSidebarProps) {
  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-border bg-[hsl(240_6%_4%)]">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Claw<span className="text-primary">Bridge</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border p-4 text-center text-xs text-muted-foreground">
        v0.3.1 Enterprise
      </div>
    </aside>
  )
}
