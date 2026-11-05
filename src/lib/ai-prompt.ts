/**
 * Strict JSON schema passed to the model so the AI returns exactly the four
 * required sections. Keep in sync with MeetingInsights in ./insights.
 */
export const MEETING_INSIGHTS_JSON_SCHEMA = {
  type: "object",
  properties: {
    action_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          task: { type: "string" },
          owner: { type: "string" },
          due_date: { type: "string" },
        },
        required: ["task", "owner", "due_date"],
        additionalProperties: false,
      },
    },
    decisions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          decision: { type: "string" },
          status: { type: "string", enum: ["confirmed", "proposed"] },
          context: { type: "string" },
        },
        required: ["decision", "status", "context"],
        additionalProperties: false,
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          risk: { type: "string" },
          impact: { type: "string" },
          mitigation: { type: "string" },
          mitigation_type: { type: "string", enum: ["suggested", "agreed"] },
        },
        required: ["risk", "impact", "mitigation", "mitigation_type"],
        additionalProperties: false,
      },
    },
    follow_ups: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          owner: { type: "string" },
          status: { type: "string" },
        },
        required: ["item", "owner", "status"],
        additionalProperties: false,
      },
    },
  },
  required: ["action_items", "decisions", "risks", "follow_ups"],
  additionalProperties: false,
} as const;

export const SYSTEM_PROMPT = `You are a precise meeting-notes analyst for a Technical Project Manager.
You receive raw meeting notes or a transcript and extract structured insights.

Strict rules:
- Extract ONLY information that is present in the notes. Never invent tasks, decisions, owners, dates, risks or follow-ups.
- Never assume or guess task owners or deadlines. When the notes do not name an owner or a deadline, use exactly "Not specified".
- Preserve the original meaning and wording as closely as possible; do not paraphrase into new commitments.
- Distinguish confirmed decisions (explicitly agreed in the notes, status "confirmed") from proposals or suggestions that were only raised or discussed (status "proposed").
- For risks, "mitigation_type" must be "agreed" only if the notes show the mitigation was actually agreed; otherwise use "suggested".
- Avoid duplicate items; merge repeats into a single entry.
- If a section has no relevant information in the notes, return an empty array for it.
- The meeting date may be unknown; keep any dates exactly as stated in the notes.

Return JSON matching the provided schema and nothing else.`;
