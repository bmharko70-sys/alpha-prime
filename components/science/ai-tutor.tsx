"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { AIStatusIndicator, type AIStatus } from "@/components/motion/ai-status-indicator"
import { Send, Square, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AiTutor() {
  const [input, setInput] = React.useState("")
  const { messages, sendMessage, status, stop, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const busy = status === "submitted" || status === "streaming"
  const aiStatus: AIStatus =
    status === "error" ? "error" : status === "submitted" ? "thinking" : status === "streaming" ? "generating" : "idle"

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Live tutor</h2>
        {busy && <AIStatusIndicator status={aiStatus} />}
      </div>
      <div className="flex min-h-[420px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1 pt-4" aria-live="polite">
          {messages.length === 0 && (
            <p className="animate-in-fade-up rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
              Ask a question about a calculation, element, reaction, or living system. Responses use the configured Groq model.
            </p>
          )}
          {messages.map((message, messageIndex) => (
            <div
              key={message.id}
              style={{ animationDelay: `${Math.min(messageIndex, 4) * 40}ms` }}
              className={cn(
                "animate-in-fade-up",
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-xl bg-primary p-3 text-sm text-primary-foreground"
                  : "max-w-[90%] rounded-xl border border-border bg-muted/50 p-3 text-sm leading-6",
              )}
            >
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                ) : null,
              )}
            </div>
          ))}
          {busy && (
            <div className="animate-in-fade-up flex items-center gap-3 text-xs text-muted-foreground" role="status">
              <AIStatusIndicator status={aiStatus} />
            </div>
          )}
          {status === "error" && (
            <div className="animate-in-fade-up flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <span>Groq could not answer. Confirm the server Groq key and model configuration, then retry.</span>
              <Button type="button" variant="outline" size="sm" className="press-feedback" onClick={() => regenerate()}>
                Retry
              </Button>
            </div>
          )}
        </div>
        <form
          className="mt-5 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (input.trim() && !busy) {
              sendMessage({ text: input.trim() })
              setInput("")
            }
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            disabled={busy}
            placeholder="Ask Academia…"
            aria-label="Message Academia"
            className="min-h-11 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow duration-200 focus:ring-2 focus:ring-primary"
          />
          {busy ? (
            <Button type="button" variant="outline" className="press-feedback" onClick={() => stop()} aria-label="Stop response">
              <Square />
            </Button>
          ) : (
            <Button type="submit" disabled={!input.trim()} className="press-feedback" aria-label="Send message">
              <Send />
            </Button>
          )}
          <Button type="button" variant="ghost" className="press-feedback" onClick={() => setMessages([])} aria-label="Clear chat">
            <Trash2 />
          </Button>
        </form>
      </div>
    </section>
  )
}
