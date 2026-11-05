import { describe, expect, it } from "vitest";
import { formatInsightsReport } from "../lib/report";
import { hasAnyItems, EMPTY_INSIGHTS, type MeetingInsights } from "../lib/insights";

const sample: MeetingInsights = {
  actionItems: [{ task: "Draft API spec", owner: "Priya", dueDate: "2026-11-12" }],
  decisions: [
    { decision: "Adopt Postgres for storage", status: "confirmed", context: "" },
    { decision: "Migrate reporting to new service", status: "proposed", context: "needs costing" },
  ],
  risks: [
    {
      risk: "Third-party API rate limits",
      impact: "Delays the sync feature",
      mitigation: "Add request batching",
      mitigationType: "suggested",
    },
  ],
  followUps: [{ item: "Confirm budget with finance", owner: "Not specified", status: "Pending" }],
};

describe("formatInsightsReport", () => {
  it("renders all four sections with owners and due dates", () => {
    const report = formatInsightsReport(sample);
    expect(report).toContain("## Action Items");
    expect(report).toContain("Draft API spec");
    expect(report).toContain("Owner: Priya");
    expect(report).toContain("Due date: 2026-11-12");
    expect(report).toContain("## Decisions");
    expect(report).toContain("[Confirmed] Adopt Postgres for storage");
    expect(report).toContain("[Proposed] Migrate reporting to new service");
    expect(report).toContain("## Risks & Blockers");
    expect(report).toContain("Suggested mitigation (not agreed in the meeting)");
    expect(report).toContain("## Follow-Ups");
    expect(report).toContain("Owner: Not specified");
  });

  it("labels agreed mitigations as agreed", () => {
    const report = formatInsightsReport({
      ...sample,
      risks: [{ ...sample.risks[0], mitigationType: "agreed" }],
    });
    expect(report).toContain("Agreed mitigation:");
  });

  it("shows No items identified for empty sections", () => {
    const report = formatInsightsReport(EMPTY_INSIGHTS);
    expect(report.match(/No items identified/g)).toHaveLength(4);
  });
});

describe("hasAnyItems", () => {
  it("is false for empty insights and true for non-empty ones", () => {
    expect(hasAnyItems(EMPTY_INSIGHTS)).toBe(false);
    expect(hasAnyItems(sample)).toBe(true);
  });
});
