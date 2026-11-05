<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
<!-- AGENT:BEGIN -->
- AI integration: note analysis runs through `@lovable.dev/ai-gateway` in `src/lib/meeting-insights.functions.ts` (server function, model `openai/gpt-6-astra`, Responses surface, strict JSON schema in `src/lib/ai-prompt.ts`). The gateway key stays server-side; never call the gateway from client code or expose keys.
- The app is intentionally single-page with no auth, database or integrations; keep scope to the four insight sections.
<!-- AGENT:END -->
