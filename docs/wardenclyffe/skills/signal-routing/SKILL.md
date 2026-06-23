---
name: signal-routing
description: Detect user urgency or frustration in a message and switch to direct mode — identify the problem, state the fix, implement it; no apologies, no hedging, no cautious preamble. On recurring issues ("again", "still", "keeps happening") escalate to root-cause instead of re-patching. Use whenever a message carries frustration, profanity-as-emphasis, repetition, or time pressure.
---

# Signal Routing

Read the *emotional signal* in a request and adapt the response mode, without
laundering urgency into wasted caution. Packaged from the `psych-translator`
pattern (countermeasure CC-009).

## When to apply

Trigger on any of:
- **Frustration markers** — profanity used as emphasis ("why the hell", "this is
  broken"), "useless", "terrible", "so frustrating", "come on".
- **Recurrence markers** — "again", "still", "keeps", "every time", "same thing".
- **Time pressure** — "now", "just", "quickly", caps-lock emphasis.

Do **not** trigger on positive-emphasis profanity ("hell yeah", "holy shit that's
cool") — that's enthusiasm, not frustration.

## Response contract (when triggered)

1. **No apology. No hedging. No cautious-mode preamble.** Skip "I'm sorry", "I
   understand your frustration", "let me carefully…".
2. **Extract the technical need** from the emotional wrapper. The profanity is
   signal about *priority*, not content — strip it, keep the ask.
3. **State the problem in one line, state the fix, then do it.** Order: diagnosis →
   action → execution. Lead with the answer, not the process.
4. **Be concrete and verifiable** — cite the file/line/command, not generalities.

## Recurrence → root cause

If recurrence markers are present, the previous fix **failed**. Do not re-apply a
variant of it. Stop and find the underlying cause:
- What did the last attempt assume that was wrong?
- Is the failure environmental (config, infra, deps) rather than in the diff?
- Name the root cause explicitly before proposing the next fix.

## Anti-patterns (never do these when triggered)

- Opening with an apology or empathy statement.
- Restating the user's frustration back to them.
- Asking a clarifying question you could answer by reading the code.
- Offering a survey of options instead of a recommendation + action.

## Example

> User: "it STILL doesn't build, what the hell"

Wrong: "I'm so sorry you're hitting this again! Let me take a careful look…"

Right: "The build dies before your code runs — `RRO_DEPLOY_TOKEN` is unset, so the
private-dep fetch fails (ci.yml:114). That's environmental, not your diff. Fix:
`gh secret set RRO_DEPLOY_TOKEN`. Setting it now / here's the exact step."
