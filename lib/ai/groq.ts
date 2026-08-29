import "server-only"

import { createGroq } from "@ai-sdk/groq"

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

export function groqModel() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error("Groq is not configured. Set GROQ_API_KEY in the server environment.")
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL
  return createGroq({ apiKey })(model)
}

export function getAIErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("Groq is not configured")) {
    return error.message
  }
  return "Groq could not generate a response. Check GROQ_API_KEY and GROQ_MODEL, then try again."
}
