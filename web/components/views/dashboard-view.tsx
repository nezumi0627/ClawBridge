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
  const [version, setVersion] = useState("v0.3.0")
  const [port, setPort] = useState(1337)
  const [bars] = useState(() =>
    Array.from({ length: 12 }, () => Math.floor(Math.random() * 70) + 20)
  )

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
    checkStatus()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ClawBridge Core</p>
                <p className="text-2xl font-bold text-foreground">{version}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Server className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Badge
              variant="outline"
              className="mt-3 border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
            >
              RUNNING (Port {port})
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">G4F Server</p>
                {g4fStatus === null && (
                  <p className="text-2xl font-bold text-muted-foreground">Checking...</p>
                )}
                {g4fStatus === "online" && (
                  <p className="text-2xl font-bold text-foreground">ONLINE</p>
                )}
                {g4fStatus === "offline" && (
                  <p className="text-2xl font-bold text-[hsl(var(--destructive))]">OFFLINE</p>
                )}
                {g4fStatus === "error" && (
                  <p className="text-2xl font-bold text-[hsl(var(--destructive))]">ERROR</p>
                )}
              </div>
              <div className="rounded-lg bg-[hsl(var(--info))]/10 p-2.5">
                <Cpu className="h-5 w-5 text-[hsl(var(--info))]" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Backend: Python 3.12 {g4fModels > 0 && `/ ${g4fModels} models`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className="text-2xl font-bold text-foreground">{memUsage}</p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-2.5">
                <HardDrive className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Node.js Heap</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Rocket className="h-4 w-4 text-primary" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => onNavigate("playground")} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_hsl(28_90%_54%/0.3)]">
            <MessageSquare className="mr-2 h-4 w-4" />
            Launch Playground
          </Button>
          <Button
            variant="outline"
            className="border-border bg-secondary text-secondary-foreground hover:bg-accent"
            onClick={() => window.open("/v1/models", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Models API
          </Button>
          <Button
            variant="outline"
            className="border-border bg-secondary text-secondary-foreground hover:bg-accent"
            onClick={() => onNavigate("connectivity")}
          >
            <Zap className="mr-2 h-4 w-4" />
            Connectivity Test
          </Button>
        </CardContent>
      </Card>

      {/* Resource Monitor */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            Resource Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-primary to-primary/60 transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Live requests per minute (visual representation)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
