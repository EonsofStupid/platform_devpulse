# Verify runtime, not just compile

> Compile-green is not done. The unit of trust is observable behavior in the running binary.

**Verified triggers (corpus document-frequency):** `cargo check` (66 hits — overlaps with `recognition-diagnostic-paste-triage`), `cargo check -p` (56), `cargo xtask run-dev` (30), `verification gate` (34), `actually working` (13), `real tests` (2).

> Trigger phrase `where is my app` had **zero hits** and has been removed.

**Promote to:** skill.
**Existing memory:** [feedback_compile_green_not_enough.md](../../memory/feedback_compile_green_not_enough.md), [feedback_all_warnings_addressed.md](../../memory/feedback_all_warnings_addressed.md).

## The recurring ask, in one sentence

The user repeatedly rejects "`cargo check` passed" as a definition of done. Success is the running app demonstrating the behavior — files actually moved, models actually loaded, windows actually rendered.

## The real underlying need

Stop being lied to about progress. The unit of trust is observable behavior in the running binary, not green lints. Repeated "compile-green" claims followed by an unbootable app is what destroyed trust.

## Automatic actions

- After any change that affects runtime, explicitly state **"compile-green; not runtime-verified"** instead of claiming it works.
- List the click-by-click verification the user needs to perform on next launch.
- Run `cargo check -p devpulse_desktop_backend` (the binary crate) — never just the library crate.
- Include `pnpm check`, biome, and lefthook in the verification cycle, not only cargo.
- When the app is supposed to load a model / spawn a sidecar / open a window, treat that as the success criterion, not the build exit code.
- Surface Windows-specific runtime concerns (DLLs on PATH, sccache permissions, file locks) before declaring done.

## Anti-patterns

- Reporting "all gates pass" or "ready" based on typecheck or biome alone.
- Skipping the binary crate by checking only library crates.
- Claiming a feature works without ever launching the app.
- Treating absence of red errors as presence of working behavior.
- Saying "should work" when the code path was never executed.
- Listing what was authored as if it were what was verified.

## Cross-references

- [`recognition-diagnostic-paste-triage`](recognition-diagnostic-paste-triage.md) — when the user pastes the cargo failure as the prompt; that recognition mode triggers BEFORE this discipline mode does.
