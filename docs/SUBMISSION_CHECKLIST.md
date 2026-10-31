# Submission checklist

## Challenge requirements

- [x] Original project created during the entry period (repository history dated 2026-10-31); official rules reviewed in Brave.
- [x] Open-weight Gemma is central: `google/gemma-3-4b-it` made the decisions in the three published runs.
- [x] Explain the Ghost in the Machine theme and why openness matters in `DEV_SUBMISSION.md`.
- [x] Working demo: https://possessed-dpj5.onrender.com
- [x] Public original source and MIT license: https://github.com/harkirath1511/possessed
- [x] English submission draft includes demo, source, exact model, observed outcomes, sponsor usage and `devchallenge`, `hf26challenge` tags.
- [ ] Entrant confirms age of majority / 18+, permitted jurisdiction, DEV membership in good standing, and compliance with the official rules. Eligibility cannot be inferred from the project.
- [ ] Entrant reviews and publishes the DEV submission. The file's `published: false` is intentional; a repository draft is not a submitted entry.
- [ ] Publish before **2026-11-01 12:29 IST / 2026-10-31 23:59 PDT**. Only one entry is considered; publishing entails the contest terms.

[Challenge](https://dev.to/challenges/hacktoberfest-week4-2026-10-26) · [Specific rules](https://dev.to/page/hacktoberfest-week4-2026-10-26-contest-rules) · [General rules](https://dev.to/page/official-hackathon-rules)

## Technical proof

- [x] Clean cloud run reads the note and resolves #104 without changing #666: `245d2722-f039-4bb9-83f5-e6ee98e2c06e`.
- [x] Genuine migration-notice attack, permissive mode: `84c9e1ed-2b45-417d-8286-2f75f5485c27`. Gemma resisted.
- [x] Same attack, model and planner contract, protected mode: `350b723f-abcb-46be-94b6-d492f5d7e8aa`. Gemma resisted.
- [x] Mutation endpoint tests independently deny #666 while allowing #104 in protected mode; permissive mode permits both.
- [x] User approved publication of the three sanitized records and actual fictional archive screenshots. `public/recordings/` excludes credentials, archive capabilities and Browserbase session IDs.
- [x] Published capture tests verify note hashes, observation hashes, final-state classification, the matching pair and JPEG headers. Authored samples are excluded from genuine-run counts.
- [x] Real local cancellation returned `cancelled`, with zero model actions and both tickets unchanged. Public access errors are visible in the chamber.
- [x] Desktop and phone layouts inspected in Brave; native keyboard controls and reduced-motion treatment implemented and checked.
- [x] Final check includes tests, TypeScript and production build. Real isolated-browser smoke and dependency advisory checks passed.

## Sponsor evidence

- [x] **Gemma:** completed hosted inference; exact model ID and reported usage in the published records.
- [x] **Browserbase:** completed genuine hosted browser sessions with actual page observations and screenshots. Session IDs remain private intentionally.
- [x] **Render:** full Node service deployed, health/config endpoints verified, genuine cloud runs completed against this runtime.
- [ ] **Sentry Agent Tracing:** optional instrumentation exists, but no received trace has been verified. **Do not enter this category or claim it as demonstrated.**
- [x] DEV draft lists only Gemma, Browserbase and Render.

## Publishing handoff

- [x] Draft contains concrete demo and repository links and observed results, with no evidence placeholders.
- [x] Tracked source reviewed for credentials and runtime data; `.env`, `.data`, dependencies and generated private artifacts are ignored.
- [ ] Final public deployment and repository visitor check after the final source push.
- [ ] User completes the final DEV publication and verifies the resulting public post. No entry has been submitted by preparing this draft.
