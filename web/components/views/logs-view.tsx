"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollText, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogLine {
  text: string
  level: "info" | "warn" | "error" | "success" | "default"
}

function parseLogLevel(line: string): LogLine["level"] {
  if (line.includes("[INFO]")) return "info"
  if (line.includes("[WARN]")) return "warn"
  if (line.includes("[ERROR]")) return "error"
  if (line.includes("[SUCCESS]")) return "success"
  return "default"
}

const levelColorMap: Record<LogLine["level"], string> = {
  info: "text-[hsl(var(--info))]",
  warn: "text-[hsl(var(--warning))]",
  error: "text-[hsl(var(--destructive))]",
  success: "text-[hsl(var(--success))]",
  default: "text-muted-foreground",
}

export function LogsView() {
  const [logs, setLogs] = useState<LogLine[]>([])
  const [loading, setLoading] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/logs")
      if (!res.ok) throw new Error("Failed to fetch logs")
      const data = await res.json()
      const text: string = data.logs || ""
      const lines = text.split("\n").map((line: string) => ({
        text: line,
        level: parseLogLevel(line),
      }))
      setLogs(lines)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setLogs([{ text: `Error loading logs: ${message}`, level: "error" }])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Card className="bg-card border-border">
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ScrollText className="h-4 w-4 text-primary" />
            Console Output (clawbridge.log)
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="auto-scroll" className="text-xs text-muted-foreground">
                Auto-scroll
              </Label>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-border bg-secondary text-secondary-foreground hover:bg-accent"
              onClick={fetchLogs}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3 w-3" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={scrollRef}
            className="h-[600px] overflow-y-auto rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed"
          >
            {logs.length === 0 && !loading && (
              <p className="text-muted-foreground">No logs available.</p>
            )}
            {logs.map((line, i) => (
              <div key={i} className={cn("py-0.5", levelColorMap[line.level])}>
                {line.text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
