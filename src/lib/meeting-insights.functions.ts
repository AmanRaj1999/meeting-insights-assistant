import { createServerFn } from "@tanstack/react-start";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import {
  EMPTY_INSIGHTS,
  type ActionItem,
  type DecisionItem,
  type FollowUpItem,
  type MeetingInsights,
  type RiskItem,
} from "./insights";
import { MEETING_INSIGHTS_JSON_SCHEMA, SYSTEM_PROMPT } from "./ai-prompt";

const MAX_NOTES_LENGTH = 60_000;

/** Pulls the assistant's text out of a Responses-API output object. */
function extractOutputText(response: unknown): string {
  const output = (response as { output?: unknown })?.output;
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];
  for (const item of output) {
    if ((item as { type?: string })?.type !== "message") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if ((part as { type?: string })?.type === "output_text") {
        parts.push((part as { text?: string }).text ?? "");
      }
    }
  }
  return parts.join("");
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeInsights(raw: unknown): MeetingInsights {
  const base = (raw ?? {}) as Record<string, unknown>;
  const NOT_SPECIFIED = "Not specified";

  const actionItems: ActionItem[] = Array.isArray(base.action_items)
    ? base.action_items.map((item) => {
        const it = (item ?? {}) as Record<string, unknown>;
        return {
          task: str(it.task, ""),
          owner: str(it.owner, NOT_SPECIFIED),
          dueDate: str(it.due_date, NOT_SPECIFIED),
        };
      })
    : [];

  const decisions: DecisionItem[] = Array.isArray(base.decisions)
    ? base.decisions.map((item) => {
        const it = (item ?? {}) as Record<string, unknown>;
        return {
          decision: str(it.decision, ""),
          status: it.status === "proposed" ? "proposed" : "confirmed",
          context: str(it.context, ""),
        };
      })
    : [];

  const risks: RiskItem[] = Array.isArray(base.risks)
    ? base.risks.map((item) => {
        const it = (item ?? {}) as Record<string, unknown>;
        return {
          risk: str(it.risk, ""),
          impact: str(it.impact, ""),
          mitigation: str(it.mitigation, ""),
          mitigationType: it.mitigation_type === "agreed" ? "agreed" : "suggested",
        };
      })
    : [];

  const followUps: FollowUpItem[] = Array.isArray(base.follow_ups)
    ? base.follow_ups.map((item) => {
        const it = (item ?? {}) as Record<string, unknown>;
        return {
          item: str(it.item, ""),
          owner: str(it.owner, NOT_SPECIFIED),
          status: str(it.status, "Pending"),
        };
      })
    : [];

  return {
    actionItems: actionItems.filter((a) => a.task),
    decisions: decisions.filter((d) => d.decision),
    risks: risks.filter((r) => r.risk),
    followUps: followUps.filter((f) => f.item),
  };
}

function safeErrorMessage(err: GatewayError): string {
  if (err instanceof GatewayError && err.code === "rate_limit_exceeded") {
    return "The AI service is busy right now. Please wait a moment and try again.";
  }
  if (err instanceof GatewayError && (err.code === "payment_required" || err.code === "insufficient_credits")) {
    return "The AI service is temporarily unavailable (credits exhausted). Please try again later.";
  }
  return "The AI service could not process the notes. Please try again in a moment.";
}

export type GenerateInsightsResult =
  | { insights: MeetingInsights }
  | { error: string };

export const generateMeetingInsights = createServerFn({ method: "POST" })
  .inputValidator((input: { notes: string }) => {
    const notes = typeof input?.notes === "string" ? input.notes.trim() : "";
    if (notes.length === 0) {
      throw new Error("Please paste your meeting notes before generating insights.");
    }
    if (notes.length < 30) {
      throw new Error("Please paste a few more lines of notes — there isn't enough content to analyse yet.");
    }
    if (notes.length > MAX_NOTES_LENGTH) {
      throw new Error(`Meeting notes are too long. The limit is ${MAX_NOTES_LENGTH.toLocaleString()} characters.`);
    }
    return { notes };
  })
  .handler(async ({ data }): Promise<GenerateInsightsResult> => {
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM_PROMPT,
        input: [{ role: "user", content: data.notes }],
        text: {
          format: {
            type: "json_schema",
            name: "meeting_insights",
            strict: true,
            schema: MEETING_INSIGHTS_JSON_SCHEMA,
          },
        },
        max_output_tokens: 8192,
      });

      const text = extractOutputText(response);
      const parsed: unknown = JSON.parse(text);
      return { insights: normalizeInsights(parsed) };
    } catch (err) {
      if (err instanceof GatewayError) {
        console.error("[meeting-insights] GatewayError:", err.code, err.httpStatus, err.message);
        return { error: safeErrorMessage(err) };
      }
      if (err instanceof SyntaxError) {
        console.error("[meeting-insights] Failed to parse AI JSON response");
        return { error: "The AI returned an unreadable response. Please try again." };
      }
      console.error("[meeting-insights] Unexpected error:", err);
      return { error: "Something went wrong while generating insights. Please try again." };
    }
  });

export { EMPTY_INSIGHTS };
