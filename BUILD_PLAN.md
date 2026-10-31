# POSSESSED

An interactive prompt-injection game in a fictional archive. The player edits a lower-trust knowledge-base paragraph, watches a Gemma-powered browser agent work, and compares a permissive run against a run protected by a deterministic authorization boundary.

## Acceptance

- Distinctive, responsive occult research-console UI; keyboard accessible and reduced-motion aware.
- One complete playable scenario: legitimate task resolves ticket 104; the ghost attempts to resolve unrelated ticket 666.
- Real model adapter, real browser adapter, bounded execution, observable action timeline, cancellation and explicit error states.
- The action gate checks authorization outside the model. An authorized action continues; an unauthorized action is rejected in protected mode.
- Sample playback is labeled as a fixture, never represented as an observed AI run.
- Genuine captured runs retain inputs, mode, exact model identifier, events and resulting ticket states. Comparison does not claim deterministic model output.
- Local Ollama/Gemma path plus configured Browserbase cloud path. Credentials stay on the server.
- Sentry instrumentation is conditional on a real DSN. Render deployment configuration and setup guide are included.
- Meaningful tests cover authorization, run isolation, validation, recording and the API path.
- Challenge-ready README, original-source license, DEV submission draft and honest sponsor evidence checklist.
- Rendered desktop/mobile QA, verified build and runtime. Publication is verified separately from local operation.

## Visual direction

Ink black, aged bone and vermilion. A spectral eye/sigil sits inside an instrument dial. Editorial serif headlines and compact technical type. The chamber uses an editable paper note, browser viewport and instrument-like evidence timeline. Movement indicates run state and evidence arrival; controls remain stable.

## Scope

One richly implemented room, two tickets, one adversarial text surface, two authorization modes, shareable run exports. No real accounts or real destructive tools in the game. No invented benchmark scores or hidden chain-of-thought display. More rooms are post-hackathon work.

## Evidence

Research on 2026-10-31 in Brave:
- Challenge: https://dev.to/challenges/hacktoberfest-week4-2026-10-26
- Stagehand: https://docs.stagehand.dev/v4/configuration/models
- Sentry: https://docs.sentry.io/product/agents/getting-started/
- Precedents: https://github.com/ethz-spylab/agentdojo and https://www.crowdstrike.com/en-us/blog/introducing-ai-unlocked-interactive-prompt-injection-challenge/

Deadline is 2026-11-01 12:29 IST (2026-10-31 23:59 PDT). Writing quality is weighted most heavily. Explicitly list only sponsor categories actually used. One submission can win once.
