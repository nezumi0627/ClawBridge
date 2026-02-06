"use client"

import { useCallback, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Network, Cpu, Bug, AlertTriangle, Save, Check, Loader2 } from "lucide-react"

export function SettingsView() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(() => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="bg-card border-border">
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Settings className="h-4 w-4 text-primary" />
            General Configuration
          </CardTitle>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved" : "Save Settings"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Network */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Network</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[180px_1fr] items-center gap-6">
                <div>
                  <Label className="text-sm text-foreground">Server Port</Label>
                  <p className="text-xs text-muted-foreground">Main API port</p>
                </div>
                <Input
                  type="number"
                  defaultValue={1337}
                  className="w-32 border-border bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-6">
                <div>
                  <Label className="text-sm text-foreground">Binding Address</Label>
                  <p className="text-xs text-muted-foreground">0.0.0.0 for all interfaces</p>
                </div>
                <Input
                  type="text"
                  defaultValue="0.0.0.0"
                  className="w-48 border-border bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* G4F Backend */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">G4F Backend</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[180px_1fr] items-center gap-6">
                <div>
                  <Label className="text-sm text-foreground">Provider Strategy</Label>
                  <p className="text-xs text-muted-foreground">How to select providers</p>
                </div>
                <Select defaultValue="fastest">
                  <SelectTrigger className="w-48 border-border bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="fastest">Fastest Response</SelectItem>
                    <SelectItem value="stable">Most Stable</SelectItem>
                    <SelectItem value="random">Random Rotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-6">
                <div>
                  <Label className="text-sm text-foreground">Auto-Retry</Label>
                  <p className="text-xs text-muted-foreground">Retry on failure count</p>
                </div>
                <Input
                  type="number"
                  defaultValue={3}
                  className="w-24 border-border bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Debugging */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Bug className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Debugging</h3>
            </div>
            <div className="grid grid-cols-[180px_1fr] items-center gap-6">
              <div>
                <Label className="text-sm text-foreground">Log Level</Label>
              </div>
              <Select defaultValue="INFO">
                <SelectTrigger className="w-36 border-border bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[hsl(var(--destructive))]/30 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Clear All Cache</p>
              <p className="text-xs text-muted-foreground">
                Remove all temporary model caches and cookies.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-[hsl(var(--destructive))]/50 bg-transparent text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
            >
              Reset Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
