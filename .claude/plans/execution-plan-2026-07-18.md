# DevPulse — Execution Plan (2026-07-18)

Companion to `definitive-audit-2026-07-18.md`. One slice at a time, ≤5 files each, verified in the RUNNING app before the next. STOP for owner between slices. No `#[allow]`/`panic=abort`/`--fix`/crash-suppression. Nothing here is executed until the owner approves.

App is currently running (dev build, sccache disabled via `SCCACHE_DISABLE=1`); frontend/CSS slices hot-reload via Vite, Rust slices need a rebuild.

---

## S1 — Kill the ggus crash-panic (header-only parse) · Rust · Cat 2
- **Files:** `systems/devpulse-engine/src/platform/model_loader/models/discovery.rs` (`read_gguf_metadata`, 480-526).
- **Change:** replace `GGuf::new(&buf)` (whole-file parser → underflow at `ggus file.rs:132` on any model >16 MiB) with the header-only path. `GGuf`/`GGufMetaMapExt` accessors (`general_architecture`, `llm_context_length`, `get_usize` at 502-517) currently run OUTSIDE the `catch_unwind` — reimplement metadata extraction from `GGufReader::read_header()` + KV iteration so the 16 MiB prefix is valid input and no accessor can panic. Keep `catch_unwind` as defense-in-depth.
- **Pre-req (Rust-weakness rule):** web-verify the exact ggus 0.5.1 API (`GGufReader::new(&data).read_header()`, KV/metadata iteration for `general.architecture`, `<arch>.context_length`, `<arch>.vocab_size`, `general.parameter_count`) BEFORE authoring.
- **Owner (author):** `strict-foundation-engineer` (ggus API change, ML-sensitive).
- **Verify (run-and-observe):** rebuild, run-dev; `scan_models` completes with **0 "Rust panic"** lines and **0 new `crash-*.json`**, and the SAME 52 models still register; `cargo check -p devpulse-engine` 0 warnings.
- **Rollback:** `git checkout -- discovery.rs`.

## S2 — Seed writes to the correct DB → dashboard shows data · Rust · Cat 2
- **Files:** `interfaces/desktop/src-tauri/src/lib.rs` (`seed_dev_data`, 1508-1545).
- **Change:** line 1509 `platform.analytics()` (system DuckDB — has no `daily_stats`) → `platform.user_analytics()` (user DuckDB — owns `USER_ANALYTICS_SCHEMA.daily_stats`). The COUNT check + `append("daily_stats", …)` then hit the DB the reader (`fetch_dashboard`) already reads.
- **Pre-req:** confirm `platform.user_analytics()` accessor exists (audit: `analytics.rs:85`) and the seed columns match `USER_ANALYTICS_SCHEMA` (audit confirmed: `total_model_calls/total_messages/total_prompt_tokens/total_completion_tokens/avg_latency_ms` all present).
- **Verify:** rebuild, run-dev on a fresh data dir; boot log shows `DuckDB seeded: daily_stats` (not "Dev seed failed"); dashboard Activity/Commit/Build sparklines render non-empty; Developer Stats reflect seeded counts.
- **Rollback:** `git checkout -- lib.rs`.

## S3 — "Add a project" dialog actually opens · Rust + Svelte · Cat 2
- **Files:** `interfaces/desktop/src-tauri/src/commands/models/mod.rs` (`pick_directory`, 1712-1725); `interfaces/desktop/src/lib/domains/app/projects/feature/ProjectSwitcher.svelte` (`handleCreate` 40-66).
- **Change:** `pick_directory` uses `rfd::AsyncFileDialog` with **no parent window** → dialog never surfaces (proven: 0 invokes ever). Give it the main window as parent (`.set_parent(&window)` with the Tauri window's raw handle) OR switch to `tauri-plugin-dialog` + a dialog capability — decide by run-and-observe (try `set_parent` first; it avoids a new dep/capability). In `ProjectSwitcher.handleCreate`, stop silently swallowing failures: distinguish user-cancel (no-op) from dialog-failed (surface `projectsState.error`), and ensure the `if (creating) return` guard can't wedge the button.
- **Verify:** run-dev; click "No active project ▾" → "New project" → **the OS folder picker appears**; pick this repo → dropdown shows name+path; dashboard Projects → 1; IPC log now shows `pick_directory` + `create_project`.
- **Rollback:** `git checkout -- mod.rs ProjectSwitcher.svelte` (+ revert Cargo.toml/capability if the plugin path is taken).

## S4 — Color to your reference (vivid) · SD source + Svelte · OWNER-CONFIRMED VALUES
- **Files:** `scripts/build/styledictionary/generate-scales.mjs` (BRAND_HUES chroma 89-96); `interfaces/desktop/src/lib/design/components/dynamic-background/DynamicBackground.svelte` (variant); `interfaces/desktop/src/lib/domains/app/devpulse/feature/dashboard/DevPulseDashboard.svelte` (accent bindings) — ≤5.
- **Change (proposal, owner approves exact values first — locked colors rule):**
  (a) Raise brand-hue chroma toward the reference via a per-stop chroma envelope (teal 0.08→~0.13, cyber 0.10→~0.15, purple 0.12→~0.16; keep within sRGB to cut the 383 out-of-gamut). (b) Point the dashboard's animated background at the vivid `primary` variant (brand-blue, already built at DynamicBackground:184-232) or author a vivid `devpulse` variant matching the reference; raise its alpha/opacity/brightness off the near-invisible 8%/0.58/0.8. (c) Optionally rebind gauges from raw brand hues to role/vivid accents.
  Regenerate: `pnpm ds:tokens:build`.
- **Owner decision:** I sample DASHBOARD-REFERENCE-01, propose exact oklch values, you confirm — THEN apply.
- **Verify:** Vite HMR — palette + background shift **live in the open window in seconds** (no rebuild). Owner eyes vs reference. `pnpm audit:color` out-of-gamut count drops.
- **Rollback:** `git checkout -- generate-scales.mjs DynamicBackground.svelte DevPulseDashboard.svelte` + `ds:tokens:build`.

## S5 — Contained + fluid layout · Svelte/CSS
- **Files:** `DevPulseDashboard.svelte` (grid wrapper 80-86); optionally `Frame.svelte` content zone; the fluid `--size-*`/`--padding-*` consumption. ≤5, sliced if needed.
- **Change:** add a `max-width` + centered container around `grid-cols-12` (kills edge-to-edge stretch on wide monitors); migrate fixed spacing/gauge sizes to consume the cqi `--size-*`/`--padding-*` tokens so the declared containers actually drive fluid sizing. (Same max-width pattern later for DevForge/Overmind/Wiredfront/clyffy.)
- **Verify:** run-dev; resize window → content clamps smoothly, columns stop ballooning; TokenDebugOverlay shows cqi resolving.
- **Rollback:** `git checkout` the touched files.

## S6 — Boot 12s → sub-second (DuckDB retention) · Rust
- **Files:** `systems/devpulse-engine/src/platform/telemetry/span_writer.rs` + shutdown path.
- **Change:** add a `span_traces` retention/rollover (cap rows / age-out on boot) + explicit `CHECKPOINT` on graceful shutdown; reconsider persisting dev-level spans. Do NOT hand-truncate the 46 MB file.
- **Verify:** run-dev; boot log `System analytics: DuckDB (…ms)` drops well under 1s on the next boot; DB + WAL stop growing unbounded.
- **Rollback:** `git checkout`.

## S7 — Hygiene (independent, low-risk)
- IPC-logging façade instead of monkey-patching `window.__TAURI_INTERNALS__.invoke` (`logger.ts:293`) — restores `frontend:ipc` logs on Tauri 2.10.3.
- Boot label "LibSQL" → "Turso" (boot-line formatter); verify no code constructs a literally-named LibSql adapter.
- Backlog (separate, sized later): 3 circular deps (`audit:deps` → 0 errors), dead-token/unused-file prune (reconcile with the Sprint-02 shell-restoration plan before deleting — do NOT bulk-delete), contrast fixes (`text-muted`, `success-fg`).

---

## Execution discipline
- One slice → verify in the running app → STOP → owner OK → next.
- Rust slices (S1, S2, S3, S6) need a rebuild (sccache stays disabled to avoid the deadlock). Frontend/CSS (S4, S5, S7-invoke) hot-reload via Vite.
- Recommended order: **S2 → S3 → S1 → S4 → S5 → S6 → S7.** (S2 gives visible data fastest and is a 1-line change; S3 unblocks the core workflow; S1 stops the crash noise; S4 is the visual payoff and is live via HMR.) Owner may reorder — e.g. S4 first if the visual is the priority.
- "Done" = observed working in the running app, not compile-green.
