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
  "gemini-2.5-flash",
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
      setResults(data.results || [])
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
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">{summary.successRate}%</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--success))]/10 p-2.5">
                  <Activity className="h-5 w-5 text-[hsl(var(--success))]" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {summary.working} / {summary.total} working
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fastest Model</p>
                  <p className="text-2xl font-bold text-foreground">
                    {summary.speed?.fastest?.time ? `${summary.speed.fastest.time}ms` : "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {summary.speed?.fastest?.model || "None"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                  <p className="text-2xl font-bold text-foreground">
                    {summary.speed?.average ? `${summary.speed.average}ms` : "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--info))]/10 p-2.5">
                  <Clock className="h-5 w-5 text-[hsl(var(--info))]" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Across all working models</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card className="bg-card border-border">
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Zap className="h-4 w-4 text-primary" />
            Connectivity Check
          </CardTitle>
          {isRunning && (
            <Badge variant="outline" className="border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]">
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Running
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Run a background connectivity test across all configured providers. Results are saved
            and can be viewed even after refreshing the page.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={startTest}
              disabled={isRunning}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isRunning ? "Running..." : "Run Background Test"}
            </Button>
            <Button
              variant="outline"
              className="border-border bg-secondary text-secondary-foreground hover:bg-accent"
              onClick={copyResults}
            >
              {copied ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-[hsl(var(--success))]" />
              ) : (
                <ClipboardCopy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy JSON"}
            </Button>
            <Button
              variant="outline"
              className="border-border bg-secondary text-secondary-foreground hover:bg-accent"
              onClick={() => (window.location.href = "/api/test/dump")}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Dump
            </Button>
          </div>

          {/* Results Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="bg-secondary text-muted-foreground">Model / Provider</TableHead>
                  <TableHead className="bg-secondary text-muted-foreground w-[100px]">Status</TableHead>
                  <TableHead className="bg-secondary text-muted-foreground w-[100px]">Latency</TableHead>
                  <TableHead className="bg-secondary text-muted-foreground">Response / Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinations.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {isRunning ? "Loading combinations..." : "No combinations available. Start the server to see available models."}
                    </TableCell>
                  </TableRow>
                )}
                {combinations.map((combo, i) => {
                  const result = getResultForCombo(combo)
                  const isRec = RECOMMENDED.includes(combo.model)
                  return (
                    <TableRow key={i} className="border-border hover:bg-secondary/50">
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          {combo.display}
                          {isRec && (
                            <Badge variant="outline" className="border-[hsl(var(--info))] bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] text-[10px] px-1.5 py-0">
                              REC
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!result ? (
                          <Badge variant="outline" className="border-border bg-secondary text-muted-foreground text-xs">
                            WAITING
                          </Badge>
                        ) : result.success ? (
                          <Badge
                            variant="outline"
                            className="border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] text-xs"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" /> PASS
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] text-xs"
                          >
                            <XCircle className="mr-1 h-3 w-3" /> FAIL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={cn("font-mono text-sm", result?.success ? "text-foreground" : "text-muted-foreground")}>
                        {result ? `${result.responseTime}ms` : "-"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "max-w-[300px] truncate text-xs",
                          result && !result.success ? "text-[hsl(var(--destructive))]" : "text-muted-foreground"
                        )}
                      >
                        {result ? (result.success ? result.content || "OK" : result.error || "Unknown Error") : "-"}
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
