import "server-only"

import { createGroq } from "@ai-sdk/groq"

// Groq retired llama-3.3-70b-versatile; this production model remains broadly available.
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"

export function groqModel() {
  // Prefer the conventional key. GROQ_API_KEY_2 is kept as a backwards-compatible fallback,
  // but stale secondary keys can otherwise mask a valid primary key.
  const apiKey = process.env.GROQ_API_KEY_2?.trim() || process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("Groq is not configured. Add GROQ_API_KEY to the server environment.")
  }

  const configuredModel = process.env.GROQ_MODEL?.trim()
  const retiredModels = new Set([
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
  ])
  const model = !configuredModel || retiredModels.has(configuredModel.toLowerCase())
    ? DEFAULT_GROQ_MODEL
    : configuredModel

  // Treat legacy unqualified Llama values as stale configuration rather than
  // sending a known-retired model to Groq.
  const normalizedModel = model.startsWith("llama-") || model.startsWith("llama3-")
    ? DEFAULT_GROQ_MODEL
    : model

  return createGroq({ apiKey })(normalizedModel)
}

export function getAIErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("Groq is not configured")) {
    return error.message
  }
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  if (message.includes("api key") || message.includes("invalid_api_key") || message.includes("401")) {
    return "Groq rejected the server API key. Update GROQ_API_KEY in the project environment, then retry."
  }
  if (message.includes("model") || message.includes("404")) {
    return `Groq could not find the configured model. Use ${DEFAULT_GROQ_MODEL} in GROQ_MODEL, then retry.`
  }
  return "Groq could not generate a response. Check the server Groq configuration, then try again."
}
