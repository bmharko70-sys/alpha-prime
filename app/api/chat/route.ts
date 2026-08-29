import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import { getAIErrorMessage, groqModel } from "@/lib/ai/groq"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: UIMessage[]; context?: string }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "At least one message is required." }, { status: 400 })
    }

    const result = streamText({
      model: groqModel(),
      instructions: `You are Academia O1, a precise science tutor for Physics, Chemistry, and Biology. Explain step by step, use Markdown, preserve chemical formulas and units, and never invent measurements. If context is provided, use it to resolve references. Current context: ${body.context ?? "general study"}`,
      messages: await convertToModelMessages(body.messages),
    })

    return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })
  } catch (error) {
    return Response.json({ error: getAIErrorMessage(error) }, { status: 502 })
  }
}
