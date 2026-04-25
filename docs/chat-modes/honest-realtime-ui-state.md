# Honest, real-time UI state

> Runes reflect Rust truth. No mocks. No fabricated progress.

**Verified triggers (corpus document-frequency):** `rune` (55 hits), `$state` (36), `transparent` (23), `$derived` (22), `mock` (18), `honest state` (2).

**Promote to:** skill.
**Existing memory:** [project_devtool_pattern.md](../../memory/project_devtool_pattern.md), [project_cortex_surfaces.md](../../memory/project_cortex_surfaces.md).

## The recurring ask, in one sentence

The user insists on transparent live state at all times: VRAM usage, GPU resources, slot statuses, download progress per shard, system info — all rune-driven from real Tauri events, never hardcoded mock numbers, never silent loading.

## The real underlying need

Trust through visibility. If the backend is doing something, the UI says so live. If it isn't, the UI doesn't pretend.

## Automatic actions

- Wire Rust `LoaderEventSink` → `app.emit` → frontend listener for every long operation.
- Use `$state` / `$derived` runes; subscribe via `createTauriEvent` or equivalent.
- Show per-shard progress for SafeTensors (1-of-7), per-file progress for downloads, friendly speeds and ETAs.
- When backend reports unknown / zero, show "unknown" or "not reported" — never fabricate.
- Cancel buttons are wired to real Rust verbs that abort the operation.
- Status pills / health badges read from health-poll runes, not local timers.

## Anti-patterns

- Hardcoded VRAM numbers in a wizard preset.
- Spinner that never resolves because the event is never emitted.
- 30-minute timeouts triggered because the completion event was never bridged.
- UI labels saying "Ready" before the rune confirms it.
- Mocked GPU info when the real backend value is empty.
