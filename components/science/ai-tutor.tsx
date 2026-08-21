"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Send, Square, Trash2 } from "lucide-react"

export function AiTutor() {
  const [input, setInput] = React.useState("")
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const busy = status === "submitted" || status === "streaming"

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Live tutor</h2>
      <div className="flex min-h-[420px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 && <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">Ask a question about a calculation, element, reaction, or living system. Responses come from the configured AI Gateway.</p>}
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-xl bg-primary p-3 text-sm text-primary-foreground" : "max-w-[90%] rounded-xl border border-border bg-muted/50 p-3 text-sm leading-6"}>
              {message.parts.map((part, index) => part.type === "text" ? <p key={index} className="whitespace-pre-wrap">{part.text}</p> : null)}
            </div>
          ))}
          {busy && <p className="text-xs text-muted-foreground">Academia is thinking…</p>}
          {status === "error" && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">The AI assistant couldn't connect. Please try again.</p>}
        </div>
        <form className="mt-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (input.trim() && !busy) { sendMessage({ text: input.trim() }); setInput("") } }}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} disabled={busy} placeholder="Ask Academia…" aria-label="Message Academia" className="min-h-11 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          {busy ? <Button type="button" variant="outline" onClick={() => stop()} aria-label="Stop response"><Square /></Button> : <Button type="submit" disabled={!input.trim()} aria-label="Send message"><Send /></Button>}
          <Button type="button" variant="ghost" onClick={() => setMessages([])} aria-label="Clear chat"><Trash2 /></Button>
        </form>
      </div>
    </section>
  )
}
