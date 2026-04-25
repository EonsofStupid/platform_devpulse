# Pasted compiler/check output as the task

> The paste IS the prompt. Fix THIS exact diagnostic, nothing else.

**Verified triggers (corpus document-frequency):** `cargo check` (66 hits), `svelte-check` (43), `cargo test` (20), `error[E` (12).
**Promote to:** skill — `fix-this-diagnostic`.

> This recognition mode subsumes the prior corrective theme `paste-build-failure-diagnose-and-fix`. Same situation, framed positively: the user has the output and wants surgical triage, not a tour.

## When this mode is active

User has pasted verbatim error output from cargo / svelte-check / biome / tsc. Often a `error[E####]` Rust diagnostic with `file:line:col`, or a JSON svelte-check resource with `Cannot find module '$lib/...'`, or a PowerShell prompt suffix `PS {repo}/...>` indicating raw terminal paste. Rarely any prose around it; the paste IS the prompt.

## What it means

The user has the output in front of them. They want triage on this exact diagnostic with the exact code reference cited — not a refactor proposal, not a "while I was looking" tour.

## Automatic actions

- Open the `file:line` cited in the diagnostic first; read enough to identify the root cause.
- State the cause in one or two sentences before proposing the fix.
- Limit the fix to the file(s) the diagnostic cites — unless a structural cause forces a sibling edit, and call that out.
- Re-run the same command the user pasted from and paste the new output back.
- If multiple diagnostics are pasted, fix them in the order they appear and report each as resolved.

## Anti-patterns

- Dragging in unrelated cleanups.
- Suggesting a tooling/version change instead of fixing the code.
- "Refactoring the module while I'm here".
- Glossing over the diagnostic with a higher-level redesign.
- Skipping the re-run — leaving the user to verify.

## Cross-references

- [`verify-runtime-not-just-compile`](verify-runtime-not-just-compile.md) — the discipline pair: even after the diagnostic is gone, "compile-green" alone is not done.
- [`all-warnings-non-fatal-included`](all-warnings-non-fatal-included.md) — when the paste has both errors AND warnings, fix every warning too.
