"use client"

import React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Send, Trash2, Hand, Code, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  meta?: string
}

export function PlaygroundView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Connection established. Select a model and send a message to begin.",
      meta: "ClawBridge Core",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("gpt-4o-mini")
  const [provider, setProvider] = useState("")
  const [status, setStatus] = useState<{ text: string; variant: "default" | "success" | "destructive" | "warning" }>(
    { text: "Ready", variant: "default" }
  )
  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const escapeHtml = useCallback((text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "<br>")
  }, [])

  const sendMessage = useCallback(async () => {
    if (isLoading || !input.trim()) return

    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setIsLoading(true)
    setStatus({ text: `Processing via ${model}...`, variant: "warning" })

    const startTime = Date.now()

    try {
      const response = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer claw-free" },
        body: JSON.stringify({
          model,
          provider: provider || undefined,
          messages: [{ role: "user", content: userMsg }],
          stream: false,
        }),
      })

      const data = await response.json()
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

      if (data.error) {
        const errMsg = data.error.message || JSON.stringify(data.error)
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `**Execution Failed**\n\n${errMsg}`, meta: `Error / ${elapsed}s` },
        ])
        setStatus({ text: "Failed", variant: "destructive" })
      } else {
        const content = data.choices?.[0]?.message?.content || "Empty result"
        const actualProvider = data.provider || provider || "Auto"
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            meta: `${data.model} (@${actualProvider}) / ${elapsed}s`,
          },
        ])
        setStatus({ text: `Completed via ${actualProvider}`, variant: "success" })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Network error: ${message}`, meta: "Error" },
      ])
      setStatus({ text: "Connection Error", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, model, provider])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Memory cleared. How can I assist you today?",
        meta: "ClawBridge Core",
      },
    ])
  }

  const statusBadgeClass = cn(
    "text-xs px-3 py-1",
    status.variant === "success" && "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    status.variant === "destructive" && "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]",
    status.variant === "warning" && "border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
    status.variant === "default" && "border-[hsl(var(--info))] bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]"
  )

  return (
    <div className="flex h-full flex-col gap-3 animate-fade-in-up">
      {/* Config Bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="w-full sm:w-44">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Provider Strategy</label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Auto-Route (Best)" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value=" ">Auto-Route (Best)</SelectItem>
              <SelectItem value="g4f">G4F (Free Chain)</SelectItem>
              <SelectItem value="gemini">Gemini API (Google)</SelectItem>
              <SelectItem value="groq">Groq (Ultra-Fast)</SelectItem>
              <SelectItem value="pollinations">Pollinations (Fixed)</SelectItem>
              <SelectItem value="puter">Puter Cloud</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Model Selection</label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectGroup>
                <SelectLabel className="text-muted-foreground">Recommended (Fast)</SelectLabel>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Pollinations)</SelectItem>
                <SelectItem value="gemini-2.1-flash">Gemini 2.1 Flash (Google)</SelectItem>
                <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Groq)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-muted-foreground">Advanced Models</SelectLabel>
                <SelectItem value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet (Puter)</SelectItem>
                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Google)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (G4F-Chain)</SelectItem>
                <SelectItem value="deepseek-chat">DeepSeek V3 (G4F)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-muted-foreground">Experimental</SelectLabel>
                <SelectItem value="qwq-32b">QwQ 32B (Thinking)</SelectItem>
                <SelectItem value="command-r">Command R+ (Tools)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Badge variant="outline" className={statusBadgeClass}>
          {isLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
          {status.text}
        </Badge>
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto rounded-xl border border-border bg-background/40 p-4 space-y-4"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 3%, black 97%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 3%, black 97%, transparent)",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 animate-slide-in",
              msg.role === "user"
                ? "ml-auto bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_6px_20px_hsl(28_90%_54%/0.25)]"
                : "mr-auto bg-secondary/80 text-secondary-foreground border border-border/50"
            )}
            style={{
              borderBottomRightRadius: msg.role === "user" ? "4px" : undefined,
              borderBottomLeftRadius: msg.role === "assistant" ? "4px" : undefined,
            }}
          >
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-3 [&_code]:font-mono [&_code]:text-xs"
              dangerouslySetInnerHTML={{
                __html: msg.role === "user" ? escapeHtml(msg.content) : msg.content.replace(/\n/g, "<br>"),
              }}
            />
            {msg.meta && (
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider opacity-50">
                {msg.meta}
              </p>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="mr-auto flex items-center gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Thinking...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-border bg-secondary text-secondary-foreground hover:bg-accent text-xs"
            onClick={() => { setInput("Hello, world!"); textareaRef.current?.focus() }}
          >
            <Hand className="mr-1 h-3 w-3" /> Greet
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border bg-secondary text-secondary-foreground hover:bg-accent text-xs"
            onClick={() => { setInput("Code a simple Snake game in Python"); textareaRef.current?.focus() }}
          >
            <Code className="mr-1 h-3 w-3" /> Coding
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border bg-secondary text-secondary-foreground hover:bg-accent text-xs"
            onClick={clearChat}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Reset
          </Button>
        </div>

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message... (Shift+Enter for multi-line)"
            className="min-h-[48px] max-h-[200px] flex-1 resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="h-auto min-w-[80px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
