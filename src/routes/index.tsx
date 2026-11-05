import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Copy,
  Download,
  Gavel,
  Loader2,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

import { generateMeetingInsights } from "@/lib/meeting-insights.functions";
import { EMPTY_INSIGHTS, hasAnyItems, type MeetingInsights } from "@/lib/insights";
import { formatInsightsReport } from "@/lib/report";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meeting Notes AI Assistant" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into structured action items, decisions, risks & blockers and follow-ups.",
      },
      { property: "og:title", content: "Meeting Notes AI Assistant" },
      {
        property: "og:description",
        content:
          "Turn raw meeting notes into structured action items, decisions, risks & blockers and follow-ups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type LoadState = "idle" | "loading" | "done";

function SectionCard({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h2>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count === 0 ? "—" : count}
        </span>
      </header>
      {children}
    </section>
  );
}

function EmptySection() {
  return <p className="text-sm text-muted-foreground italic">No items identified</p>;
}

function Index() {
  const generate = useServerFn(generateMeetingInsights);
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [insights, setInsights] = useState<MeetingInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isLoading = state === "loading";
  const canGenerate = notes.trim().length > 0 && !isLoading;

  async function handleGenerate() {
    setState("loading");
    setError(null);
    setInsights(null);
    try {
      const result = await generate({ data: { notes } });
      if ("error" in result) {
        setError(result.error);
        setState("idle");
      } else {
        setInsights(result.insights);
        setState("done");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  async function handleCopy() {
    if (!insights) return;
    try {
      await navigator.clipboard.writeText(formatInsightsReport(insights));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying to the clipboard failed. You can still download the report.");
    }
  }

  function handleDownload() {
    if (!insights) return;
    const blob = new Blob([formatInsightsReport(insights)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting-insights-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  const showResults = state === "done" && insights !== null;
  const resultsEmpty = showResults && !hasAnyItems(insights);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Meeting Notes AI Assistant
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Paste your meeting notes or transcript below. The assistant extracts action items,
            decisions, risks &amp; blockers and follow-ups — without inventing anything that
            isn&apos;t in your notes.
          </p>
        </header>

        <main className="mt-8 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <label htmlFor="meeting-notes" className="block text-sm font-medium text-foreground">
              Meeting notes
            </label>
            <textarea
              id="meeting-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste raw meeting notes or a transcript here…"
              rows={9}
              className="mt-2 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              disabled={isLoading}
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Generating…
                  </>
                ) : (
                  <>
                    <ClipboardList className="size-4" aria-hidden />
                    Generate Meeting Insights
                  </>
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                {notes.length.toLocaleString()} characters
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {isLoading && (
            <p className="text-sm text-muted-foreground">
              Analysing your meeting notes — this usually takes a few seconds…
            </p>
          )}

          {state === "idle" && !error && insights === null && (
            <p className="text-sm text-muted-foreground">
              Your four insight sections will appear here after you generate them.
            </p>
          )}

          {showResults && (
            <>
              {resultsEmpty ? (
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm text-muted-foreground">
                    No items identified in these notes. Try pasting fuller meeting notes with
                    discussions, assignments and decisions.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <SectionCard icon={<ClipboardList className="size-4" />} title="Action Items" count={insights.actionItems.length}>
                    {insights.actionItems.length === 0 ? (
                      <EmptySection />
                    ) : (
                      <ol className="space-y-3">
                        {insights.actionItems.map((item, i) => (
                          <li key={i} className="text-sm">
                            <p className="font-medium text-foreground">{item.task}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Owner: {item.owner} · Due: {item.dueDate}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </SectionCard>

                  <SectionCard icon={<Gavel className="size-4" />} title="Decisions" count={insights.decisions.length}>
                    {insights.decisions.length === 0 ? (
                      <EmptySection />
                    ) : (
                      <ol className="space-y-3">
                        {insights.decisions.map((item, i) => (
                          <li key={i} className="text-sm">
                            <p className="font-medium text-foreground">{item.decision}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs">
                              <span
                                className={
                                  item.status === "confirmed"
                                    ? "rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
                                    : "rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground"
                                }
                              >
                                {item.status === "confirmed" ? "Confirmed" : "Proposed"}
                              </span>
                              {item.context && <span className="text-muted-foreground">{item.context}</span>}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </SectionCard>

                  <SectionCard icon={<ShieldAlert className="size-4" />} title="Risks & Blockers" count={insights.risks.length}>
                    {insights.risks.length === 0 ? (
                      <EmptySection />
                    ) : (
                      <ol className="space-y-3">
                        {insights.risks.map((item, i) => (
                          <li key={i} className="text-sm">
                            <p className="font-medium text-foreground">{item.risk}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Impact: {item.impact}</p>
                            <p className="mt-1 text-xs">
                              <span className="font-medium text-foreground">
                                {item.mitigationType === "agreed" ? "Agreed mitigation" : "Suggested mitigation"}
                              </span>
                              <span className="text-muted-foreground"> · {item.mitigation}</span>
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </SectionCard>

                  <SectionCard icon={<ArrowUpRight className="size-4" />} title="Follow-Ups" count={insights.followUps.length}>
                    {insights.followUps.length === 0 ? (
                      <EmptySection />
                    ) : (
                      <ol className="space-y-3">
                        {insights.followUps.map((item, i) => (
                          <li key={i} className="text-sm">
                            <p className="font-medium text-foreground">{item.item}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Owner: {item.owner} · Status: {item.status}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </SectionCard>
                </div>
              )}

              {!resultsEmpty && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                    {copied ? "Copied" : "Copy Report"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <Download className="size-4" aria-hidden />
                    Download Report
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
