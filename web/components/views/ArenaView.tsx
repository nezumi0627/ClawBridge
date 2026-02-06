"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Trophy,
    Send,
    Trash2,
    Loader2,
    Zap,
    Clock,
    Type,
    Plus,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ModelResult {
    model: string
    provider: string
    content: string
    speed: string
    charCount: number
    isLoading: boolean
    error?: string
}

export function ArenaView() {
    const [input, setInput] = useState("")
    const [selectedModels, setSelectedModels] = useState<string[]>([])
    const [results, setResults] = useState<Record<string, ModelResult>>({})
    const [isAllLoading, setIsAllLoading] = useState(false)
    const [availableModels, setAvailableModels] = useState<{ id: string, display: string }[]>([])

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        async function fetchModels() {
            try {
                const res = await fetch("/api/test/working")
                const data = await res.json()
                if (data.working && data.working.length > 0) {
                    setAvailableModels(data.working.map((m: any) => ({ id: m.model, display: m.display })))
                } else {
                    setAvailableModels([
                        { id: "gpt-4o-mini", display: "gpt-4o-mini (@pollinations)" },
                        { id: "gemini-2.1-flash", display: "gemini-2.1-flash (@gemini)" },
                        { id: "llama-3.1-8b-instant", display: "llama-3.1-8b-instant (@groq)" },
                        { id: "claude-3-7-sonnet-latest", display: "claude-3-7-sonnet-latest (@puter)" }
                    ])
                }
            } catch (e: unknown) {
                console.error(e)
            }
        }
        fetchModels()
    }, [])

    const runBattle = async () => {
        if (!input.trim() || selectedModels.length === 0) return

        setIsAllLoading(true)
        const newResults: Record<string, ModelResult> = { ...results }

        selectedModels.forEach(m => {
            newResults[m] = {
                model: m,
                provider: "Auto",
                content: "",
                speed: "0s",
                charCount: 0,
                isLoading: true
            }
        })

        setResults(newResults)

        await Promise.all(selectedModels.map(async (modelId) => {
            try {
                const start = Date.now()
                const res = await fetch("/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer claw-free" },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [{ role: "user", content: input.trim() }],
                        stream: false,
                    }),
                })

                const data = await res.json()
                const end = Date.now()
                const diff = ((end - start) / 1000).toFixed(2)

                if (data.error) {
                    setResults(prev => ({
                        ...prev,
                        [modelId]: {
                            ...prev[modelId],
                            isLoading: false,
                            error: data.error.message || "Unknown error"
                        }
                    }))
                } else {
                    const rawContent = data.choices?.[0]?.message?.content || ""
                    const content = rawContent.split("\n").filter((line: string) => !line.trim().startsWith("-#")).join("\n").trim()

                    setResults(prev => ({
                        ...prev,
                        [modelId]: {
                            ...prev[modelId],
                            provider: data.provider || "Auto",
                            content,
                            speed: `${diff}s`,
                            charCount: content.length,
                            isLoading: false
                        }
                    }))
                }
            } catch (e: any) {
                setResults(prev => ({
                    ...prev,
                    [modelId]: {
                        ...prev[modelId],
                        isLoading: false,
                        error: e.message
                    }
                }))
            }
        }))

        setIsAllLoading(false)
    }

    const toggleModel = (id: string) => {
        if (selectedModels.includes(id)) {
            setSelectedModels(selectedModels.filter(m => m !== id))
            // Also clear results for this model if it exists
            const newResults = { ...results }
            delete newResults[id]
            setResults(newResults)
        } else {
            if (selectedModels.length < 9) {
                setSelectedModels([...selectedModels, id])
            }
        }
    }

    return (
        <div className="flex h-full flex-col gap-3 animate-fade-in-up">
            {/* Selection Area */}
            <Card className="border-border bg-card/50 shrink-0">
                <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Trophy className="h-3.5 w-3.5 text-primary" />
                            Model Arena <span className="text-[10px] font-normal text-muted-foreground ml-2">(Max 9 models)</span>
                        </h2>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-7 border-border px-2"
                            onClick={() => { setResults({}); setInput(""); setSelectedModels([]) }}
                        >
                            <Trash2 className="h-3 w-3 mr-1" /> Clear All
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {availableModels.map(m => (
                            <button
                                key={m.id}
                                onClick={() => toggleModel(m.id)}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                                    selectedModels.includes(m.id)
                                        ? "bg-primary/20 border-primary text-primary shadow-[0_2px_8px_rgba(var(--primary-rgb),0.2)]"
                                        : "bg-secondary/30 border-border/50 text-muted-foreground hover:border-muted-foreground/30"
                                )}
                            >
                                {m.id}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/40">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                            placeholder="Comparison prompt..."
                            className="min-h-[40px] max-h-[80px] flex-1 resize-none rounded-lg border-border bg-background/50 text-xs focus-visible:ring-primary"
                        />
                        <Button
                            onClick={runBattle}
                            disabled={isAllLoading || !input.trim() || selectedModels.length === 0}
                            className="h-auto px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                        >
                            {isAllLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Grid - Up to 9 models */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 pr-1">
                {selectedModels.map(m => {
                    const res = results[m]
                    return (
                        <Card key={m} className={cn(
                            "border-border bg-card/30 flex flex-col h-[300px] transition-all overflow-hidden relative shadow-md hover:shadow-lg",
                            res?.isLoading && "ring-2 ring-primary/40 animate-pulse"
                        )}>
                            <div className="p-2.5 border-b border-border/50 flex items-center justify-between bg-secondary/30 shrink-0">
                                <div className="flex items-center gap-2 truncate">
                                    <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-[10px] uppercase font-black px-2 py-0.5 truncate">
                                        {m}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono truncate">@{res?.provider || "..."}</span>
                                </div>
                                <button
                                    onClick={() => toggleModel(m)}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="flex-1 p-3.5 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90 custom-scrollbar">
                                {res?.isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                                        <p className="text-xs font-bold animate-pulse uppercase tracking-widest opacity-50">Thinking...</p>
                                    </div>
                                ) : res?.error ? (
                                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <p className="text-xs font-bold">{res.error}</p>
                                    </div>
                                ) : res?.content ? (
                                    res.content
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20 italic text-[11px]">
                                        <Zap className="h-10 w-10 mb-3 opacity-10" />
                                        Ready for battle
                                    </div>
                                )}
                            </div>

                            {res && !res.isLoading && (
                                <div className="p-2 border-t border-border/50 grid grid-cols-3 gap-2 bg-secondary/20 shrink-0">
                                    <div className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-background/50 border border-border/30">
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter mb-0.5">Speed</span>
                                        <span className="text-sm font-black font-mono text-primary leading-none">{res.speed}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-background/50 border border-border/30">
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter mb-0.5">Chars</span>
                                        <span className="text-sm font-black font-mono text-foreground leading-none">{res.charCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-background/50 border border-border/30">
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter mb-0.5">Status</span>
                                        <span className="text-xs font-black text-emerald-500 leading-none">PASS</span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )
                })}

                {/* Empty slots placeholders (dashed) */}
                {selectedModels.length < 9 && Array.from({ length: 1 }).map((_, i) => (
                    <div
                        key={`placeholder-${i}`}
                        className="border-2 border-dashed border-border/30 rounded-2xl flex flex-col items-center justify-center text-muted-foreground/30 h-[300px] bg-background/5 hover:bg-background/10 hover:border-border/50 transition-all cursor-pointer group"
                    >
                        <Plus className="h-10 w-10 mb-2 group-hover:scale-110 group-hover:text-primary/40 transition-all" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">Select Model</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
