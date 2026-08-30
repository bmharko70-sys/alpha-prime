import "server-only"

import { generateText } from "ai"
import { groqModel } from "@/lib/ai/groq"

export async function groqRetrievalFallback(topic: string, subject: "biology" | "history") {
  const result = await generateText({
    model: groqModel(),
    temperature: 0.1,
    prompt: `You are a careful ${subject} research assistant. The live retrieval services returned no usable result for: "${topic}". Provide a concise, clearly labeled orientation only. Do not invent citations, URLs, dates, coordinates, quotations, statistics, or claims of verification. State that this is AI-generated background and recommend primary or scholarly sources for confirmation. Return plain text with headings: Overview, Key leads, Verification note.`,
  })
  return result.text.trim()
}

export function isUsableGroqFallback(value: string | undefined): value is string {
  return Boolean(value && value.length > 40)
}
