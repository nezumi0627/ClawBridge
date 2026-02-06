"use client"

import { useState } from "react"
import { ConsoleSidebar } from "@/components/console-sidebar"
import { DashboardView } from "@/components/views/dashboard-view"
import { PlaygroundView } from "@/components/views/playground-view"
import { LogsView } from "@/components/views/logs-view"
import { SettingsView } from "@/components/views/settings-view"
import { ConnectivityView } from "@/components/views/connectivity-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Zap,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  playground: "Playground",
  logs: "System Logs",
  settings: "Settings",
  connectivity: "Connectivity",
}

const mobileNavItems = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "playground", icon: MessageSquare },
  { id: "logs", icon: ScrollText },
  { id: "settings", icon: Settings },
  { id: "connectivity", icon: Zap },
]

export default function Page() {
  const [currentView, setCurrentView] = useState("dashboard")
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigate = (view: string) => {
    setCurrentView(view)
    setMobileOpen(false)
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <ConsoleSidebar currentView={currentView} onNavigate={navigate} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] bg-[hsl(240_6%_4%)] border-border p-0">
                <div className="flex h-14 items-center gap-2 border-b border-border px-5">
                  <span className="text-lg font-bold tracking-tight text-foreground">
                    Claw<span className="text-primary">Bridge</span>
                  </span>
                </div>
                <nav className="space-y-1 p-3">
                  {mobileNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentView === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {viewTitles[item.id]}
                      </button>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <h1 className="text-sm font-semibold text-foreground md:text-base">
              {viewTitles[currentView]}
            </h1>
          </div>

          <Badge
            variant="outline"
            className="border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] gap-1.5"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse-dot" />
            System Online
          </Badge>
        </header>

        {/* View Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 md:p-6",
            currentView === "playground" && "overflow-hidden p-3 md:p-4"
          )}
          style={currentView === "playground" ? { display: "flex", flexDirection: "column" } : undefined}
        >
          {currentView === "dashboard" && <DashboardView onNavigate={navigate} />}
          {currentView === "playground" && <PlaygroundView />}
          {currentView === "logs" && <LogsView />}
          {currentView === "settings" && <SettingsView />}
          {currentView === "connectivity" && <ConnectivityView />}
        </main>
      </div>
    </div>
  )
}
