"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Zap,
  Play,
  ClipboardCopy,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Gauge,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Combination {
  provider: string
  model: string
  display: string
}

interface TestResult {
  provider: string
  model: string
  success: boolean
  responseTime: number
  content?: string
  error?: string
}

interface TestSummary {
  total: number
  working: number
  successRate: number
  speed?: {
    average: number
    fastest?: { model: string; time: number }
  }
}

const RECOMMENDED = [
  "gemini-2.1-flash",
  "gpt-4o-mini",
  "claude-3-7-sonnet-latest",
  "llama-3.3-70b-versatile",
]

export function ConnectivityView() {
  const [combinations, setCombinations] = useState<Combination[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<TestSummary | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadCombinations = useCallback(async () => {
    try {
      const res = await fetch("/api/test/combinations")
      const data = await res.json()
      setCombinations(data.combinations || [])
    } catch {
      // Silently fail - will show empty state
    }
  }, [])

  const pollResults = useCallback(async () => {
    try {
      const res = await fetch("/api/test/results")
      const data = await res.json()
      setResults(prev => {
        const testing = prev.filter(r => r.content === "Testing...")
        const updated = (data.results || []).filter((r: any) =>
          !testing.some(t => t.provider === r.provider && t.model === r.model)
        )
        return [...updated, ...testing]
      })
      if (data.summary) setSummary(data.summary)

      const statusRes = await fetch("/api/test/status")
      const statusData = await statusRes.json()
      if (statusData.status === "running") {
        setIsRunning(true)
      } else {
        setIsRunning(false)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    loadCombinations()
    pollResults()
    const interval = setInterval(pollResults, 3000)
    return () => clearInterval(interval)
  }, [loadCombinations, pollResults])

  const startTest = async () => {
    setIsRunning(true)
    try {
      await fetch("/api/test/run", { method: "POST" })
    } catch {
      setIsRunning(false)
    }
  }

  const stopTest = async () => {
    try {
      await fetch("/api/test/stop", { method: "POST" })
      setIsRunning(false)
    } catch {
      // Failed to stop
    }
  }

  const runIndividualTest = async (provider: string, model: string) => {
    // Prevent multiple tests for the same model
    setResults(prev => {
      const other = prev.filter(r => !(r.provider === provider && r.model === model));
      return [...other, { provider, model, success: true, responseTime: 0, content: "Testing...", timestamp: new Date().toISOString() }];
    });

    try {
      const res = await fetch("/api/test/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model })
      })
      const data = await res.json()

      setResults(prev => {
        const other = prev.filter(r => !(r.provider === provider && r.model === model))
        return [...other, data]
      })
    } catch (e) {
      console.error(e)
    }
  }

  const copyResults = async () => {
    if (results.length === 0) return
    await navigator.clipboard.writeText(JSON.stringify(results, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getResultForCombo = (combo: Combination) => {
    return results.find((r) => r.provider === combo.provider && r.model === combo.model)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      {summary && summary.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border border-b-2 border-b-primary/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Success Rate</p>
                  <p className="text-3xl font-black text-foreground">{summary.successRate}%</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <Activity className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {summary.working} / {summary.total} models online
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-b-2 border-b-primary/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Fastest Model</p>
                  <p className="text-3xl font-black text-foreground">
                    {summary.speed?.fastest?.time ? `${summary.speed.fastest.time}ms` : "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <Gauge className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground truncate max-w-full">
                {summary.speed?.fastest?.model || "None"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-b-2 border-b-primary/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Avg Latency</p>
                  <p className="text-3xl font-black text-foreground">
                    {summary.speed?.average ? `${summary.speed.average}ms` : "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">Global median response time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="flex-row items-center justify-between pb-4 bg-secondary/20">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Active Model Test Suite
          </CardTitle>
          {isRunning && (
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-1.5 px-2.5">
              <Loader2 className="h-3 w-3 animate-spin" /> RUNNING BATCH
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground max-w-md">
              Validate connectivity and performance of all mapped AI models. Running tests regularly ensures the bridge routes to healthy instances.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={isRunning ? stopTest : startTest}
                variant={isRunning ? "destructive" : "default"}
                className={cn(
                  "h-10 px-5 font-bold rounded-xl shadow-lg transition-all active:scale-95",
                  !isRunning && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isRunning ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" /> Stop Tests
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Run All Tests
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-10 border-border bg-secondary/50 text-foreground font-bold rounded-xl"
                onClick={copyResults}
              >
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                className="h-10 border-border bg-secondary/50 text-foreground font-bold rounded-xl"
                onClick={() => (window.location.href = "/api/test/dump")}
              >
                <Download className="mr-2 h-4 w-4" />
                Dump
              </Button>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-xl border border-border overflow-hidden shadow-inner bg-background/20">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-muted-foreground">Model / Provider</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-muted-foreground w-[120px]">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-muted-foreground w-[100px]">Latency</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-muted-foreground">Log / Insight</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-11 text-muted-foreground w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                      Discovering available model endpoints...
                    </TableCell>
                  </TableRow>
                )}
                {combinations.map((combo, i) => {
                  const result = getResultForCombo(combo)
                  const isRec = RECOMMENDED.includes(combo.model)
                  const isTesting = result?.content === "Testing..."

                  return (
                    <TableRow key={i} className="border-border hover:bg-secondary/20 transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{combo.model}</span>
                            {isRec && (
                              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[9px] uppercase font-black px-1.5 h-4">
                                PREMIUM
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">@{combo.provider}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!result ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground opacity-50">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] uppercase font-bold">Queued</span>
                          </div>
                        ) : isTesting ? (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 animate-pulse text-[10px] font-bold">
                            TESTING...
                          </Badge>
                        ) : result.success ? (
                          <Badge
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" /> ONLINE
                          </Badge>
                        ) : (
                          <Badge
                            className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold"
                          >
                            <XCircle className="mr-1 h-3 w-3" /> OFFLINE
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={cn("font-mono text-xs font-bold", result?.success ? "text-primary" : "text-muted-foreground")}>
                        {result && result.responseTime > 0 ? `${result.responseTime}ms` : "-"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "max-w-[200px] truncate text-[11px] font-medium italic",
                          result && !result.success ? "text-destructive" : "text-muted-foreground"
                        )}
                      >
                        {result ? (result.success ? `"${result.content?.slice(0, 50)}..."` : result.error || "System Error") : "Awaiting execution..."}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "h-8 w-8 rounded-lg transition-all",
                            isTesting ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 hover:bg-primary/20 hover:text-primary"
                          )}
                          onClick={() => runIndividualTest(combo.provider, combo.model)}
                          disabled={isRunning || isTesting}
                        >
                          {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
