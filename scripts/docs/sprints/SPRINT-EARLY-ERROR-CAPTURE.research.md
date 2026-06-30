# Research: Early-Error Capture Breaks Svelte Bundle Load

**Date**: 2026-04-21
**Sprint**: `SPRINT-EARLY-ERROR-CAPTURE.md`
**Status**: IN_PROGRESS — owner review pending

## Mission

Identify *why* commit `7b4072aa` (pre-module inline error capture in `app.html` + `drainEarlyErrors()` in `logger.ts` + `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` env var in `lib.rs`) causes the SvelteKit bundle to stop mounting in the Tauri webview, and choose a fix.

## Empirical Evidence (no speculation)

| Run | Binary built from | `[vite] connected.` → `[layout] Root layout mounted` |
|---|---|---|
| 08:16 local (2026-04-21) | `e3fc157e` (pre-inline-script) | ~11 s |
| 08:47 local (2026-04-21) | `7b4072aa` (inline-script active) | 27 + s, **never mounts** |

- Chromium stderr (via `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--enable-logging=stderr --v=1`) shows `[vite] connecting...` and `[vite] connected.` in both runs.
- In the 08:47 run, after `[vite] connected.` (084707.621), only the following non-SvelteKit lines appear: USB device enumeration error (Windows driver noise), extension GC (Chromium internal). Zero Svelte log output.
- Session JSONL `session-2026-04-21-084704.jsonl` contains **zero** `frontend:*` entries and **zero** `frontend:early:*` entries.
- Rust backend reaches READY in both runs (+5.1 s and +10.2 s respectively); boot is healthy.
- The ONLY frontend-layer change between the two binaries is commit `7b4072aa`.

## SSOT Map — Current Error-Capture Surface

| Location | Layer | Responsibility | Owner |
|---|---|---|---|
| `interfaces/desktop/src/app.html` (inline `<script>`, added by `7b4072aa`) | Pre-module JS | Wraps `console.error`; captures `error` (capture phase) + `unhandledrejection`; pushes to `window.__DEVPULSE_EARLY_ERRORS__` | `7b4072aa` |
| `interfaces/desktop/src/lib/sys/logger.ts::drainEarlyErrors()` (added by `7b4072aa`) | Svelte-mounted | Drains `window.__DEVPULSE_EARLY_ERRORS__` into the IPC log buffer | `7b4072aa` |
| `interfaces/desktop/src/lib/sys/logger.ts::installGlobalHandlers()` | Svelte-mounted | Sets `window.__DEVPULSE_LOGGER_READY__ = true`; wraps `console.error`, `console.warn`; adds `error`, `unhandledrejection` listeners | Pre-existing |
| `interfaces/desktop/src-tauri/src/lib.rs` (top of `run()`, added by `7b4072aa`) | Process-level | Sets `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--enable-logging=stderr --v=1` so Chromium logs JS/nav errors to the Tauri process stderr | `7b4072aa` |
| Rust tracing stderr layer | Process-level | Captures tracing events into stderr pretty formatter (does NOT capture arbitrary child-process stderr like Chromium's) | Pre-existing |

**Duplication / overlap risks identified:**

1. **Two `error` listeners and two `unhandledrejection` listeners fire on window after the Svelte app mounts** — one from `app.html` (capture phase, pushes to array) and one from `installGlobalHandlers()` (bubble phase, calls `log()` → IPC). After `__DEVPULSE_LOGGER_READY__` flips true, the `app.html` listeners early-return, but they are still attached. Not a bug, but wasted work.
2. **Two `console.error` wrappers layer** — the `app.html` wrapper wraps the native `console.error`. Then `installGlobalHandlers()` reads the *already-wrapped* `console.error` as `originalError`, wraps it again, and installs *that*. Every `console.error` call goes: outer wrapper (logger.ts) → inner wrapper (app.html) → native. Not a bug per se, but cumulative state that is hard to reason about.
3. **Chromium stderr (from `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS`)** prints `INFO:CONSOLE:N` / `ERROR:CONSOLE:N` lines to stderr for every `console.*` call in the webview. The `app.html` inline script does NOT push to `window.__DEVPULSE_EARLY_ERRORS__` for plain `console.log` — it only wraps `console.error`. So Chromium stderr is a superset of the early-error array. For diagnostic purposes, the Layer-2 (Chromium stderr) capture may be sufficient without Layer-1 (inline script).

## Files Read In Full

1. `interfaces/desktop/src/app.html` (1..71) — current state with inline script.
2. `interfaces/desktop/src/lib/sys/logger.ts` (1..239) — current state with `drainEarlyErrors`, global declare, `__DEVPULSE_LOGGER_READY__` flag, double-wrapper of `console.error`.
3. `interfaces/desktop/src-tauri/src/lib.rs` (36..66) — `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` set at top of `run()`.
4. `interfaces/desktop/src/routes/+layout.svelte` — onMount pattern; calls `installGlobalHandlers()` first thing.
5. `interfaces/desktop/src/hooks.client.ts` — SvelteKit handleError hook; calls `console.error` synchronously inside the Svelte runtime.
6. `@vite/client` from `node_modules/.pnpm/vite@7.3.2.../vite/dist/client/client.mjs` — uses `console.error` at 4 call sites (websocket-failure paths and server-error reporting). Does NOT install its own `console.error` wrapper.

## Hypotheses (ordered by likelihood given evidence)

### H1 — Capture-phase `error` listener on `window` interferes with SvelteKit's dynamic import error propagation

`app.html` installs:
```js
window.addEventListener('error', (e) => { push('error', {...}); }, true);
```
The third argument `true` registers in **capture phase**, which runs **before** any bubble-phase handler and **before** the window-level default.

SvelteKit's boot in `app.html` is:
```js
Promise.all([import(entry.js), import(app.js)]).then(([kit, app]) => kit.start(app, element));
```
There is **no** `.catch` on this Promise.all. A module resolution error in a dynamic `import()` becomes a rejected promise. If unhandled, it becomes an `unhandledrejection` event on window — NOT an `error` event. So H1 alone does not explain the failure.

However: the SvelteKit runtime uses top-level `await` and error boundaries internally. If an early module load has a SYNCHRONOUS error during script parsing (not during execution), the browser fires an `error` event on window. Capture-phase listener fires first.

My handler does not `preventDefault()`. Chromium should still run default handling (log to stderr and mark the error). **Unless** the sequence of custom handler firing changes the order in which Chromium's internal module-registry sees the error. This is browser-implementation-specific.

**Why plausible**: changing `{ capture: true }` to `false` (bubble phase) would let the browser's default handler see the error first. If the browser's default does any bookkeeping that the SvelteKit runtime depends on, this fixes H1.

**Verify by**: change the third arg to `false` in `app.html`, rebuild, test.

### H2 — `console.error` wrapping interferes with Svelte 5 / SvelteKit runtime diagnostic paths

Svelte 5 runtime uses `console.error` in several places:
- Reactive graph cycle detection
- Lifecycle hook errors
- Hydration mismatch warnings

If my wrapper's `origErr.apply(console, args)` behaves differently than the native `console.error` (e.g., changes the `this` binding, loses the error-object reference, or alters how DevTools surfaces the stack), the runtime could enter a degraded state.

More critically: **the inline script wraps `console.error` SYNCHRONOUSLY, before any SvelteKit module loads.** SvelteKit's compiled bundle captures `console.error` at module-init time in some cases. It captures MY WRAPPER, not the native. Later, `installGlobalHandlers()` wraps it AGAIN. SvelteKit already has a reference to my wrapper; now there is a third layer.

**Why plausible**: the 08:47 run never prints any Svelte log output to Chromium stderr, even though Chromium stderr is actively capturing vite client output. This suggests Svelte's bundle either stopped loading entirely, or did load but all its console calls go into a wrapper path that silently errors. A wrapper chain breaking in a subtle way could account for this.

**Verify by**: remove only the `console.error` wrapper from the inline script (keep window listeners); rebuild; test.

### H3 — `origErr.apply(console, args)` inside the inline wrapper throws in the webview

If for some reason `origErr` is not a function at wrap time (race, re-entrancy, some WebView2-specific startup state), calling `.apply` throws. The try/catch in the wrapper covers only the `push(...)` call, not the `origErr.apply(...)` call. A throw there would bubble out of the wrapper — every `console.error` in the app then throws.

If a Svelte module calls `console.error` during its initialization and my wrapper throws, the module's init throws, the import rejects, bundle load fails.

**Why plausible**: matches the observable pattern (silent failure after `@vite/client` connects; no Svelte log output). But: `console.error` is virtually guaranteed to be a function at HTML-head-inline-script time. Less likely than H1/H2.

**Verify by**: wrap the `origErr.apply(...)` call in its own try/catch.

### H4 — `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` alone changes WebView2 startup behavior in a way that delays or breaks Svelte mount

Setting `--enable-logging=stderr --v=1` makes WebView2 pipe a large volume of Chromium logs to stderr. On Windows, heavy stderr IO from a child process over a pipe can back-pressure the child if the parent does not drain the pipe fast enough. In our setup, the Tauri process inherits stderr from the parent terminal (for `cargo run`) or its own stderr (for a spawned binary).

**Why plausible**: theoretically possible, but highly unlikely to cause a 27 s delay in Svelte mount. Chromium's stderr pipe has large buffers. And the `[vite] connected.` line DOES print, so stderr is flowing.

**Verify by**: remove ONLY the `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` change from `lib.rs`, keep the inline script. Rebuild, test.

## Anti-Pattern Risks To Avoid In The Fix

1. **Do not silently swallow errors.** The whole reason for the inline script is to capture errors that the logger can't see. If the fix makes the inline script no-op whenever a listener is installed, we lose the diagnostic value.
2. **Do not wrap `console.error` in the inline script if a different capture mechanism works.** Every wrapper layer on `console.error` is a permanent cost and makes the runtime harder to reason about.
3. **Do not rely on Chromium stderr alone for production.** `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` is dev-build-only in the current `lib.rs` (`#[cfg(debug_assertions)]`). In release builds, Chromium stderr does not flow anywhere. If we lean entirely on Layer 2, release builds lose error visibility.
4. **Do not `preventDefault()` in custom error handlers.** That stops the browser from reporting the error to the native stderr (Layer 2 capture). Leaving default behavior intact is important.

## Candidate Fixes (to be chosen by owner)

Each option is a minimal surgical change. Options are orthogonal where marked; most are mutually exclusive.

| ID | Summary | Drops | Keeps | Risk |
|---|---|---|---|---|
| **A** | Remove only the `console.error` wrapper from `app.html`; keep window `error` (capture) + `unhandledrejection` listeners | `console.error` wrapping in inline script; the log `target:"frontend:early:console"` path | All other parts of `7b4072aa` | Loss of pre-logger `console.error` capture; all other pre-module errors still flow |
| **B** | Change `addEventListener('error', ..., true)` to `false` (bubble phase) in `app.html` | Capture-phase interception | Everything else | Bubble-phase handler fires AFTER browser default; browser gets first crack |
| **C** | Remove the `app.html` inline script entirely; rely on Layer-2 Chromium stderr for pre-logger capture | All Layer-1 capture (inline script + `drainEarlyErrors()`) | `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` env var; Chromium stderr still logs `console.error`, `ERROR:CONSOLE:N`, etc. | Release builds lose pre-logger capture (env var is dev-only). Mitigation: also enable env var in release via an opt-in flag. |
| **D** | Keep inline script but wrap `origErr.apply(...)` in its own try/catch | Nothing functional | All functional behavior | Defends against H3 only. Minimal change. |
| **E** | Compose A + B + D together | `console.error` wrap; capture-phase listener; unguarded `.apply` | Window listeners in bubble phase; `drainEarlyErrors()` path | Safest minimal surgery; still preserves the diagnostic intent for synchronous-error capture |
| **F** | Full revert of `7b4072aa` | All of Layer 1 + Layer 2 | Nothing | Loses all diagnostic improvements; equivalent to pre-session state |

## Owner Decisions Required Before Execution

### STOP — Decision 1: Which option?
- A / B / C / D / E / F — pick one
- If E, confirm the composition is what you want
- If C, confirm the intent to rely on Layer 2 and whether to remove the `#[cfg(debug_assertions)]` gate on the env var

### STOP — Decision 2: Verification strategy
- After the fix, how do we confirm success?
  - Option i: run `cargo xtask run-dev`, watch terminal for `[layout] Root layout mounted` within ~15 s of `[vite] connected.`
  - Option ii: add a synthetic `throw new Error('probe')` inside a Svelte module to exercise Layer-1 capture and verify a `frontend:early:error` entry appears in JSONL
  - Option iii: both

### STOP — Decision 3: Commit shape
- Single commit vs. split?
- If split: one commit per option so reverts are granular

## References

- Commit under review: `7b4072aa`
- Prior session evidence: `session-2026-04-21-081637.jsonl` (pre-commit), `session-2026-04-21-084704.jsonl` (post-commit)
- Boot log: `.userdata/logs/boot.log` shows both runs reach READY cleanly
