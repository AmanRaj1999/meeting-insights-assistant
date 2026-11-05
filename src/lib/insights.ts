/**
 * Client-safe types for the meeting insights output.
 * Shared between the server function (AI response mapping) and the UI.
 */

export interface ActionItem {
  task: string;
  owner: string;
  dueDate: string;
}

export interface DecisionItem {
  decision: string;
  /** "confirmed" = agreed in the meeting; "proposed" = suggested but not agreed. */
  status: "confirmed" | "proposed";
  context: string;
}

export interface RiskItem {
  risk: string;
  impact: string;
  mitigation: string;
  /** "suggested" = our suggestion, not agreed in the meeting; "agreed" = already agreed. */
  mitigationType: "suggested" | "agreed";
}

export interface FollowUpItem {
  item: string;
  owner: string;
  status: string;
}

export interface MeetingInsights {
  actionItems: ActionItem[];
  decisions: DecisionItem[];
  risks: RiskItem[];
  followUps: FollowUpItem[];
}

export const EMPTY_INSIGHTS: MeetingInsights = {
  actionItems: [],
  decisions: [],
  risks: [],
  followUps: [],
};

export function hasAnyItems(insights: MeetingInsights): boolean {
  return (
    insights.actionItems.length > 0 ||
    insights.decisions.length > 0 ||
    insights.risks.length > 0 ||
    insights.followUps.length > 0
  );
}
