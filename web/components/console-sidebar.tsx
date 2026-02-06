"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Zap,
  Trophy,
  Github,
  Info,
  Calendar,
  User,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "arena", label: "Arena", icon: Trophy },
  { id: "playground", label: "Playground", icon: MessageSquare },
  { id: "logs", label: "System Logs", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "connectivity", label: "Model Test", icon: Zap },
]

interface ConsoleSidebarProps {
  currentView: string
  onNavigate: (view: string) => void
}

export function ConsoleSidebar({ currentView, onNavigate }: ConsoleSidebarProps) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "v0.0.0"

  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-border bg-[hsl(240_6%_4%)]">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>🦞</span>
          <span>Claw<span className="text-primary">Bridge</span></span>
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
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all outline-none",
                isActive
                  ? "bg-primary/15 text-primary shadow-[0_4px_12px_rgba(var(--primary-rgb),0.1)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <a
          href="https://github.com/nezumi0627/ClawBridge"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>

        <Dialog>
          <DialogTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
              <Info className="h-4 w-4" />
              Info
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[550px] bg-background border-border text-foreground p-0 overflow-hidden shadow-2xl ring-1 ring-primary/20">
            <DialogTitle className="sr-only">ClawBridge Project Info</DialogTitle>

            {/* Header */}
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
              {/* Avatar */}
              <div className="absolute -bottom-14 left-8 z-10">
                <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                  <AvatarImage
                    src="/avatar-nezumi.png"
                    alt="nezumi0627"
                  />
                  <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                    NZ
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Background Brand Text */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.5] pointer-events-none select-none overflow-hidden">
                <span className="font-black italic tracking-tight whitespace-nowrap text-[clamp(2rem,6vw,3.75rem)]">
                  🦞CLAW
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="pt-12 pb-8 px-8 space-y-6">
              {/* Profile */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    nezumi0627
                    <span className="text-muted-foreground font-normal text-s">
                      (ねずみ)
                    </span>
                  </h2>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    Lead Architect & Core Developer
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href="https://github.com/nezumi0627"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                    title="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>

                  <a
                    href="https://x.com/nezum1n1um"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                    title="X (Twitter)"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* About */}
              <div className="bg-secondary/20 rounded-2xl p-5 border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    About Project
                  </p>
                </div>

                <p className="text-sm leading-relaxed font-medium">
                  OpenClaw を世界中の無料 / 低コスト AI モデルに接続するブリッジサーバ
                </p>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  ClawBridge は、OpenClaw をフロントとして利用し、複数のプロバイダを単一の API エンドポイントとして集約・提供する非公式ゲートウェイです。
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-secondary/30 px-3 py-2 rounded-xl border border-border/50 text-xs font-bold">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span> 2026/02/06
                </div>

                <div className="flex items-center gap-2 bg-secondary/30 px-3 py-2 rounded-xl border border-border/50 text-xs font-bold">
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[9px] border-primary/30 text-primary"
                  >
                    OSS
                  </Badge>
                  <span>ClawBridge Core {version}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 font-black tracking-tighter italic">
                  <span>🦞CLAW BRIDGE</span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                    Current Target
                  </span>
                  <span className="text-xs font-mono font-bold bg-secondary px-2.5 py-1 rounded-lg mt-1 border border-border/50">
                    {version}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        <div className="pt-2 text-center text-xs font-bold uppercase tracking-widest text-primary/80">
          {version} Enterprise
        </div>
      </div>
    </aside>
  )
}
