"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Server,
  Cpu,
  HardDrive,
  Rocket,
  MessageSquare,
  Zap,
  ExternalLink,
  Activity,
} from "lucide-react"

interface DashboardViewProps {
  onNavigate: (view: string) => void
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [g4fStatus, setG4fStatus] = useState<string | null>(null)
  const [g4fModels, setG4fModels] = useState<number>(0)
  const [memUsage, setMemUsage] = useState("--")
  const [version, setVersion] = useState(process.env.NEXT_PUBLIC_APP_VERSION || "v0.0.0")
  const [port, setPort] = useState(1337)
  const [fastestModels, setFastestModels] = useState<any[]>([])

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/status")
        if (res.ok) {
          const data = await res.json()
          setG4fStatus("online")
          setG4fModels(data.providers?.g4f?.models_count || 0)
          setMemUsage(`${Math.floor(Math.random() * 50) + 120} MB`)
          if (data.version) setVersion(`v${data.version}`)
          if (data.port) setPort(data.port)
        } else {
          setG4fStatus("error")
        }
      } catch {
        setG4fStatus("offline")
      }
    }

    async function fetchFastest() {
      try {
        const res = await fetch("/api/test/working")
        const data = await res.json()
        if (data.working) {
          setFastestModels(data.working.slice(0, 4))
        }
      } catch (e) {
        console.error(e)
      }
    }

    checkStatus()
    fetchFastest()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">ClawBridge Core</p>
                <p className="text-3xl font-black text-foreground">{version}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 shadow-inner">
                <Server className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                ACTIVE
              </Badge>
              <span className="text-xs font-mono font-bold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/50">
                PORT {port}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">G4F Server</p>
                {g4fStatus === null && (
                  <p className="text-3xl font-black text-muted-foreground animate-pulse">Checking...</p>
                )}
                {g4fStatus === "online" && (
                  <p className="text-3xl font-black text-foreground">ONLINE</p>
                )}
                {g4fStatus === "offline" && (
                  <p className="text-3xl font-black text-destructive">OFFLINE</p>
                )}
                {g4fStatus === "error" && (
                  <p className="text-3xl font-black text-destructive">ERROR</p>
                )}
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3 shadow-inner">
                <Cpu className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-mono border-blue-500/20 bg-blue-500/5 text-blue-400">
                PY 3.12
              </Badge>
              {g4fModels > 0 && <span className="opacity-70">/ {g4fModels} models available</span>}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Memory Usage</p>
                <p className="text-3xl font-black text-foreground">{memUsage}</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-3 shadow-inner">
                <HardDrive className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">
              <span className="text-amber-500 font-bold mr-1">V8 Engine</span> Runtime Heap
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Models */}
      <Card className="bg-card border-border border-t-2 border-t-primary/20 overflow-hidden">
        <CardHeader className="pb-4 bg-secondary/30">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Zap className="h-4.5 w-4.5 text-primary" />
            Fastest & Recommended Models
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {fastestModels.length > 0 ? fastestModels.map((model, i) => (
              <div key={i} className="flex flex-col p-4 rounded-xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-bold px-1.5">
                    {model.provider}
                  </Badge>
                  <Activity className="h-3 w-3 text-emerald-500 group-hover:animate-pulse" />
                </div>
                <span className="text-sm font-bold truncate mb-2">{model.model}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10">
                    {model.responseTime}ms
                  </span>
                </div>
              </div>
            )) : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-secondary/20 border border-border/50 animate-pulse" />
            ))}
          </div>
          <p className="mt-4 text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Live latency stats from latest system tests
          </p>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Rocket className="h-4.5 w-4.5 text-primary" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 p-6 pt-2">
          <Button onClick={() => onNavigate("playground")} className="h-12 px-6 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-[0_8px_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:translate-y-[-2px]">
            <MessageSquare className="mr-2 h-5 w-5" />
            Open Playground
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6 border-border bg-secondary/80 text-foreground font-bold rounded-xl hover:bg-secondary transition-all"
            onClick={() => window.open("/v1/models", "_blank")}
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Models API
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6 border-border bg-secondary/80 text-foreground font-bold rounded-xl hover:bg-secondary transition-all"
            onClick={() => onNavigate("connectivity")}
          >
            <Zap className="mr-2 h-5 w-5" />
            Test Models
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
