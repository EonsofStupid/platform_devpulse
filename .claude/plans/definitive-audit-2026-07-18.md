# DevPulse — Definitive Root-Cause Audit (2026-07-18)

**Method:** 5 parallel read-only agents (runtime-crash/debug-sentinel, dashboard-render, add-project, AI-layer/Clyffy, color-fluid-layout) + the installed `audit:*` tools. ZERO changes made. Every claim carries file:line or log evidence.

**Headline:** The platform is not destroyed and the app is not fatally crash-looping. Every symptom maps to a specific, located, individually-fixable defect — and several of them create a *misleading appearance* of catastrophe (caught panics dumping crash files; a seed that silently writes to the wrong DB). It is a working foundation blocked by a bounded bug list.

---

## Symptom → root cause → fix (ranked by impact / dependency order)

### 1. "It's crash-looping" — IT IS NOT (caught panic noise) · Cat 2
- **Cause:** `read_gguf_metadata` reads only the first 16 MiB of each model file, then hands that truncated prefix to `ggus::GGuf::new` — a **whole-file** parser. For any model larger than 16 MiB it underflows `data.len() - data_len` at `ggus-0.5.1/src/file.rs:132`, panicking 26×/boot. It is **caught** every time (`catch_unwind` at `discovery.rs:498`; workspace is `panic="unwind"`, no `abort`), so nothing crashes — but it dumps misleading `crash-*.json` files and a 3 MB log. This misread is a big part of the wasted days.
- **Evidence:** `crash-2026-07-18-153238.json` (`attempt to subtract with overflow`, `file.rs:132:21`); 26× "Rust panic" paired 1:1 with 26× "GGUF header parse failed — registering with filename-only metadata".
- **Fix:** use the header-only API `GGufReader::new(&data).read_header()` + iterate metadata KV — never touches tensor data, so the 16 MiB prefix is valid and the underflow is structurally impossible. Keep `catch_unwind` as defense-in-depth. Files: `systems/devpulse-engine/src/platform/model_loader/models/discovery.rs:487-500`. Rust/ML-sensitive → `strict-foundation-engineer`.

### 2. "The dashboard never shows data / never worked for months" — dev seed → wrong DB · Cat 2
- **Cause:** `seed_dev_data` writes sample `daily_stats` through `platform.analytics()` (the **system** analytics DuckDB), but `daily_stats` exists only in `USER_ANALYTICS_SCHEMA` (the **user** DB). The prepare fails (`"Failed to prepare analytics query"`, logged "Dev seed failed (non-fatal)"), so the 20 sample rows are never written → dashboard is perpetually empty. The **read** side of this exact bug was fixed months ago (`fetch_dashboard` now reads `user_analytics()`, commit `e94d328e`); the **write**/seed side was missed.
- **Evidence:** session `lib.rs:1124` WARN; `Dashboard loaded: 0 projects, 0 daily stats`.
- **Fix:** point the `daily_stats` block of `seed_dev_data` at `platform.user_analytics()`. File: `interfaces/desktop/src-tauri/src/lib.rs:1509-1545`. Do NOT add `daily_stats` to the system schema (would split the table).
- **Note:** even with the seed fixed, real gauges read 0 until there's usage — that's correct-over-empty, not a bug.

### 3. "I can't add a project" — folder dialog never surfaces · Cat 2
- **Cause:** the global IPC tracer logs every command; across **every** session `pick_directory` and `create_project` were invoked **zero times** — the click never reaches the backend. `pick_directory` uses `rfd::AsyncFileDialog::pick_folder()` (native, no `tauri-plugin-dialog`) spawned from a tokio worker with no parent-window handle → the dialog never appears. The failure is silently swallowed (`handleCreate` catch suppresses "No folder selected"/"cancel"), so clicking looks like nothing. The `if (creating) return` guard can also wedge the button at "Creating…" if a first call hangs.
- **Evidence:** `grep pick_directory session-*.jsonl` → none; backend `projects` table + `create_project` healthy but never called.
- **Fix:** `interfaces/desktop/src/lib/domains/app/projects/feature/ProjectSwitcher.svelte:40-66` + `interfaces/desktop/src-tauri/src/commands/models/mod.rs:1717-1725` — give the dialog a parent window / use the Tauri dialog plugin, and stop silently swallowing the failure.

### 4. "No color / not my vision" — desaturated bindings, not a broken pipeline
- **Cause:** the palette **binds correctly** (`styles/index.css:3` `@layer` order is sound; roles resolve to real colors; the "3-definer" accent contests are audit false positives — string literals in `slot-anatomy.ts`/`SetupWizardOverlay.svelte`, not overrides). The dark/monochrome look is a **binding choice + desaturated primitive**:
  1. Void base `oklch(0.08 0.01 220)` (near-black) + a **constant-chroma** ramp model where brand hues are deliberately LOW chroma: `teal 0.08, frost 0.06, cyber 0.10, purple 0.12` (`generate-scales.mjs:89-96,390-414`). Vivid ramps EXIST — `brand-electric 0.22`, cyan/blue 0.14 (`BRAND_ACCENT_HUES` lines 99-110) — but aren't bound.
  2. The dashboard binds the LOW-chroma hues: gauges `accent="teal"/"purple"/"cyber"` (`DevPulseDashboard.svelte:101,120,130`) → dim teal wash.
  3. The animated background uses `variant="devpulse"` — teal at ~0.03-0.08 chroma, 8% alpha, then `opacity: 0.58` + `brightness(0.8)` over the near-black void (`DynamicBackground.svelte:234-278`) → a barely-visible dark-teal wash. A **vivid `primary` variant already exists** (brand-blue, lines 184-232) that would resemble the reference — but the dashboard doesn't use it.
- **Fix:** bind the dashboard to the vivid accents / the `primary` background variant, and raise brand-hue chroma toward the reference (per-stop chroma envelope). Regenerate via `ds:tokens:build` → Vite HMR shows it live. Owner confirms values (locked colors rule). Files: `generate-scales.mjs`, `DynamicBackground.svelte`, `DevPulseDashboard.svelte`.

### 5. "Every column/row is stretched / no fluid clamp"
- **Cause A (columns):** `DevPulseDashboard.svelte:86` `grid grid-cols-12` has **no `max-width`** and no centering; the content zone (`Frame.svelte:84`) is only `p-4 lg:p-6`. On wide monitors each track = zone/12, so tiles balloon. Same in DevForge/Overmind/Wiredfront/clyffy.
- **Cause B (fluid clamp inert):** only **22 cqi occurrences** compiled; only 9 files consume `--size-*`, 8 consume `--padding-*`; `--space-*`/`--font-size-*` use `vw` not cqi; the dashboard uses fixed Tailwind + hardcoded px (`size={200}`, `width={400}`). Containers are declared in `Frame.svelte` (6 zones) but nothing consumes the cqi tokens — the 133 `@container` hits are Tailwind `@lg:` breakpoints, not continuous cqi. Fluid tokens are stranded.
- **Fix:** add a `max-width` + centered container to the dashboard grid; migrate content to consume the cqi `--size-*`/`--padding-*` tokens (and move `--space-*`/typography off `vw` onto cqi).

### 6. "Nothing loads for ~12 seconds" — unbounded DuckDB · Cat 2
- **Cause:** `SpanTraceWriter` inserts every tracing span into the system analytics DB with no retention; `analytics.duckdb` = 46 MB + 6.4 MB WAL, replayed 11.7 s of the 12 s boot.
- **Fix:** retention/rollover for `span_traces` + explicit `CHECKPOINT` on shutdown; reconsider persisting dev-level spans. File: `systems/devpulse-engine/src/platform/telemetry/span_writer.rs`.

### 7. "The AI layer isn't separated / not connected to Clyffy"
- **Inference IS separated:** no candle/burn/llama/rro linked; inference commands are wire-gated (`require_connected()` → `MODEL_INFERENCE_TIER2_UNAVAILABLE`). But local model **management + GGUF scanning** stays in-repo (that's the #1 crash source), and local inference **sidecars** (`llama-server`, `ollama`, candle, voice) remain as external processes — so it's a partial, not clean-single-boundary, cut.
- **Clyffy connection is FULLY WIRED** (client, `/v1/capability` handshake, connect/disconnect/discover commands, persistence, probe loop, frontend rune) — it sits "Standalone" only because `base_url` defaults to empty (`loader.rs:437`) and canonical `clyffyd` doesn't exist yet. The live `clyffy-brain` box is reachable today via the healthz bridge if its address is entered in the connect flow.

### 8. Smaller / hygiene
- IPC-logging wrap throws on Tauri 2.10.3 (`Cannot redefine property: invoke`, `logger.ts:293`) → observability off, app fine. Fix: call-boundary façade, not monkey-patch.
- Boot label prints "LibSQL" but store is **Turso** — cosmetic string in the boot formatter.
- gb10-client retry churn against the not-yet-deployed `clyffyd` — add backoff ceiling.

---

## Audit-tool health numbers (systemic debt, not the render blocker)
- `audit:cssvars`: **3351 defined / 480 consumed / 2941 dead (88%) / 362 contested / 70 undefined**.
- `audit:color`: **383 oklch outside sRGB** (clipped); contrast FAILs — `text-muted 3.49`, `success-fg 2.61`, `danger-fg 3.78`, `primary-fg 4.14` (need 4.5); hex-drift 0.
- `audit:deps`: **3 circular (errors)** — profile, auth, models/downloader barrels; 34 orphans.
- `audit:unused` (knip): **543 unused files, 435 unused exports, 783 unused types, 17+20 unused deps**.

---

## What this session's edits did (verified safe)
- `DevPulseDashboard.svelte`: `healthColors` → role vars (valid), + an `untrack`-fenced `$effect` re-fetching on active-project change — **cannot loop, cannot error**.
- `terminology.ts`: one-line `Generated:` timestamp only. No functional change.
- Nothing was broken by this session.

---

## Recommended fix order (execution plan)
1. **#1 ggus header-only parser** — kills the crash-file noise + speeds the scan. `strict-foundation-engineer`.
2. **#2 seed → user_analytics()** — dashboard finally has data.
3. **#3 add-project dialog** — you can link a project.
4. **#4 color/vision** — bind vivid accents + `primary` bg variant + chroma envelope; live via HMR. Owner-confirmed values.
5. **#5 max-width + cqi adoption** — contained, responsive HUD.
6. **#6 DuckDB retention** — 12s → sub-second boot.
7. **#8 hygiene** — invoke façade, Turso label, dead-token/circular-dep cleanup.

Each item: fixed by hand, verified in the running app (run-and-observe), never faked-done. No `#[allow]`/`panic=abort`/`--fix`/crash-json-suppression.
