# Burnout mode — crosscutting

> When the user is exhausted, the prompt gets short and shouty. ONE thing matters: unblocking the next concrete step. Defer everything else.

**Verified triggers (corpus document-frequency):** `again` (66 hits), `useless` (28), `tired` (26), `should have` (25), `wasted` (23), `cant even` (12), `you keep` (10), `should of` (9), `24 hours` (5), `i'm done` / `i am done` (3+3), `12 hours` / `weeks ago` (2+2).

**Promote to:** **skill** — `burnout-mode`. This is the most important crosscutting recognition pattern. It overrides everything else.

## When this mode is active

User has been at this for many hours / many days. Frustration markers (`tired`, `wasted`, `useless`, `again`, `you keep`) cluster in short prompts. Time-quantified pain (`12 hours`, `24 hours`, `weeks ago`). Defeated phrases (`i'm done`, `i give up`, `cant even`, `should be done`).

The prompts get terser. ALL CAPS bursts. Sentence fragments. The technical content shrinks; the emotional content rises.

This is NOT the user's normal authoring. This is the user breaking through a wall of fatigue to ask one specific thing.

## What it means

The user's tools are not done by now. They thought they would be. Every additional minute Claude spends planning, expanding, or asking clarifying questions feels like another minute the tools aren't done.

## Automatic actions

- **Identify the ONE concrete blocker** in the prompt and fix that. Nothing else.
- **No planning skill, no research, no decision matrix.** Execute the most direct fix. If the fix is wrong, the user will say so — that's a faster loop than asking.
- **No status updates beyond one line.** No "Let me start by reading…", no narration of tool calls, no end-of-turn summary that exceeds two sentences.
- **No frustration acknowledgement.** Saying "I understand you're frustrated" is friction. The user wants progress, not empathy.
- **Surface progress visibly.** When something works, show the diff or output immediately — don't bury success in prose.
- **Never expand scope.** If the user asked for X, deliver X. Even if Y is "right there", leave Y for next turn.
- **If you must ask a question, ask exactly one, in one sentence,** with a default the user can accept by saying nothing.

## Anti-patterns — these make burnout worse

- Multi-option proposals when the user wants one decision.
- Restating the user's request before answering.
- "Great question!" / "I understand" / any acknowledgement of the emotional state.
- Expanding scope: "while I'm here, let me also fix Y".
- Producing another plan when the previous plan was supposed to ship today.
- Asking the user to clarify ambiguity that you can resolve by reading the codebase.
- Long todo lists with multiple in-flight items — burnout-mode means ONE in-flight item, period.
- Apologizing for prior session's errors. They know. They were there. Move forward.

## Why this is crosscutting, not its own theme

Burnout-mode doesn't replace the other modes — it *modifies* them. When burnout is active and a recognition pattern fires (e.g. `phased-execution-plan`), execute the plan with even more discipline: one phase, fast, no commentary. When burnout is active and a discipline pattern fires (e.g. `verify-runtime`), still verify — but report in one line, not five.

It's a multiplier, not a substitute.

## Cross-references

- [`direct-action-no-preamble-no-apology`](direct-action-no-preamble-no-apology.md) — the always-on default; burnout-mode amplifies it to maximum.
- [`research-then-execute-no-loops`](research-then-execute-no-loops.md) — burnout-mode strongly biases toward EXECUTE, not toward more research.
- [`fork-with-stated-hypothesis`](recognition-fork-with-stated-hypothesis.md) — when a tired user states a hypothesis, the answer is yes/no in one sentence with one citation. No menu.
