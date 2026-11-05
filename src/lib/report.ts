import type { MeetingInsights } from "./insights";

/**
 * Builds the plain-markdown report used by both "Copy Report" and "Download Report".
 */

function section(title: string, lines: string[]): string {
  if (lines.length === 0) {
    return `## ${title}\n\nNo items identified\n`;
  }
  return `## ${title}\n\n${lines.join("\n")}\n`;
}

export function formatInsightsReport(insights: MeetingInsights): string {
  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const actionLines = insights.actionItems.map(
    (a, i) =>
      `${i + 1}. ${a.task}\n   - Owner: ${a.owner}\n   - Due date: ${a.dueDate}`,
  );

  const decisionLines = insights.decisions.map(
    (d, i) => `${i + 1}. [${d.status === "confirmed" ? "Confirmed" : "Proposed"}] ${d.decision}${d.context ? `\n   - Context: ${d.context}` : ""}`,
  );

  const riskLines = insights.risks.map(
    (r, i) =>
      `${i + 1}. ${r.risk}\n   - Impact: ${r.impact}\n   - ${
        r.mitigationType === "agreed" ? "Agreed mitigation" : "Suggested mitigation (not agreed in the meeting)"
      }: ${r.mitigation}`,
  );

  const followUpLines = insights.followUps.map(
    (f, i) => `${i + 1}. ${f.item}\n   - Owner: ${f.owner}\n   - Status: ${f.status}`,
  );

  return [
    "# Meeting Insights Report",
    "",
    `Generated: ${generatedAt}`,
    "",
    section("Action Items", actionLines),
    "",
    section("Decisions", decisionLines),
    "",
    section("Risks & Blockers", riskLines),
    "",
    section("Follow-Ups", followUpLines),
  ].join("\n");
}
