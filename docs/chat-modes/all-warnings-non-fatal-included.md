# All warnings — including non-fatal — get fixed

> "Check" means every diagnostic the toolchain emits.

**Verified triggers (corpus document-frequency):** `missing documentation` (25 hits), `clippy` (23), `dead code` (12), `non-fatal` (1), `all warnings` (2).

> Trigger phrase `specta note` had **zero hits** and has been removed.

**Promote to:** skill.
**Existing memory:** [feedback_all_warnings_addressed.md](../../memory/feedback_all_warnings_addressed.md).

## The recurring ask, in one sentence

When the user says "check," they mean every diagnostic — clippy notes, missing-docs warnings, dead-code warnings, SD5 build notes, biome warnings, lefthook notes — and pre-existing warnings on a touched file are owned by the touch.

## The real underlying need

Clean toolchain output as proof the change is finished and the work is craftsmanship-grade. Residual warnings read as "rushed."

## Automatic actions

- Run `cargo check --all-targets --message-format=short` for both `devpulse-engine` and `devpulse_desktop_backend` to catch lib-test warnings.
- Run `pnpm check` and confirm 0 errors AND 0 warnings.
- Run `pnpm ds:tokens:build` and read SD5 build notes.
- On a touched file, fix every pre-existing warning in that file too.
- For feature-gated code, guard imports with matching `#[cfg]` / `#[cfg_attr(not(feature), allow(dead_code))]`.
- Report each warning category cleared, not just "all green".

## Anti-patterns

- Reporting "0 errors" while warnings remain.
- Skipping `--all-targets` and missing test-only warnings.
- Treating "pre-existing" as an excuse to leave warnings in a touched file.
- Adding `#[allow]` instead of fixing the cause.
- Ignoring SD5 build notes about filtered references.
