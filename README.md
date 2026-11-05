# Meeting Notes AI Assistant

A lightweight productivity utility for Technical Project Managers: paste raw
meeting notes or a transcript, and an AI turns them into four structured
sections — Action Items, Decisions, Risks & Blockers, and Follow-Ups.

## Purpose

A TPM regularly needs to convert meeting discussions into structured updates.
This app automates that first step: it analyses the notes and produces a clean,
shareable report in seconds, with strict rules against inventing information.

## Workflow

1. Paste meeting notes or a transcript into the text area.
2. Click **Generate Meeting Insights**.
3. Review the four generated sections:
   - **Action Items** — task, owner, due date (missing values shown as "Not specified").
   - **Decisions** — what was agreed, marked Confirmed or Proposed.
   - **Risks & Blockers** — risk, potential impact, and mitigation clearly
     labelled as *Suggested mitigation* (not agreed in the meeting) or
     *Agreed mitigation*.
   - **Follow-Ups** — pending updates, next steps, and items needing further
     discussion or confirmation.
4. Use **Copy Report** (markdown to your clipboard) or **Download Report**
   (a `.md` file) to share the output.

## AI rules enforced by the app

- Only information present in the notes is extracted; nothing is invented.
- Owners and deadlines are never assumed — missing values become "Not specified".
- Confirmed decisions are distinguished from proposals/suggestions.
- Mitigations are distinguished from what was actually agreed.
- Duplicates are merged; empty sections show "No items identified".

## Technology stack

- React 19 + TypeScript
- TanStack Start (Vite 7) with server functions for the AI call
- Tailwind CSS v4 (design tokens in `src/styles.css`)
- Lovable AI Gateway (`@lovable.dev/ai-gateway`) — model `openai/gpt-6-astra`,
  called server-side with structured output (strict JSON schema), so the API
  key never reaches the browser.
- lucide-react for icons

## Project structure

```
src/
  ai-gateway.types.ts            # loads generated AI model type contracts
  generated/ai-gateway/          # generated model types (regenerate via CLI)
  lib/
    ai-prompt.ts                 # system prompt + strict JSON schema
    insights.ts                  # shared result types
    meeting-insights.functions.ts# server function calling the AI
    report.ts                    # markdown report builder (copy/download)
  routes/
    index.tsx                    # the single app page
  styles.css                     # design tokens (Tailwind v4)
public/
  assets/                        # local static assets (favicon lives in public/)
```

## Installation & setup

```bash
bun install        # or npm install
bun dev            # or npm run dev
```

The app runs at http://localhost:8080.
Live : https://meetlyai.lovable.app

## AI configuration

The AI integration is provided by the Lovable AI Gateway and needs no manual
API key for local development or the published site — the server function
reads the gateway credentials from the server environment at call time. There
is nothing to configure; no secret is ever exposed to the client.

## Known limitations

- The AI works from the notes as written; very sparse or garbled notes yield
  few or no items ("No items identified").
- Names, dates and phrases are extracted verbatim from the notes — if the
  notes are ambiguous, the output mirrors that ambiguity rather than guessing.
- Notes are limited to 60,000 characters per generation.
- The model can still occasionally mis-read a mention; always review the
  generated report before sharing it.
- No login, storage, or integrations (Slack/Jira/Calendar) — by design.
