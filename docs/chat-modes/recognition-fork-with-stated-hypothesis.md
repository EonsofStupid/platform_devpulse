# Fork with stated hypothesis

> The user has a position. Confirm or correct in one sentence, with reasoning.

**Verified triggers (corpus document-frequency):** `best practice` (49 hits), `right?` (7), `am I wrong` (5), `i thought` (3), `my thought` (2).
**Promote to:** none — handle inline. Promoting risks over-formalizing what is already a one-question decision.

## When this mode is active

User describes a decision they're about to make and explicitly invites correction with their reasoning attached: phrases like "my thought was…", "I thought… right?", "am I wrong?". Often a comparison frame: "X or should it be Y". Mentions a domain rule or best-practice belief the user already holds. Usually short (under 500 chars) — pure decision-mode, not an implementation request.

## What it means

The user has a working hypothesis and wants confirmation OR a stern correction with reasoning. They are not asking for options; they are asking for a yes/no on their position with a one-paragraph rationale.

## Automatic actions

- Answer the yes/no first, in one sentence — confirm or correct the hypothesis.
- Cite the actual rule / code / standard that decides it (file:line if internal, doc URL if external).
- If wrong, correct sternly with the right answer; do not soften or hedge.
- If right, say "yes — and here's why" in one or two sentences, then proceed to execute on it.
- Do not produce a multi-option menu when one position is already named.

## Anti-patterns

- Listing three or four "approaches" with pros/cons.
- Bouncing the question back ("it depends on your goals…").
- Confirming the hypothesis without checking — sycophancy.
- Refusing to commit because "both are valid" when they are not equivalent in this codebase.
- Burying the answer at the end of a long preamble.
