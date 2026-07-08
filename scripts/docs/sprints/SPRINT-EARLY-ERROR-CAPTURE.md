# SPRINT: Early-Error Capture — Unblock Svelte Bundle Load

> **Status**: PLANNED — awaiting owner decision at STOP points
> **Research**: [`SPRINT-EARLY-ERROR-CAPTURE.research.md`](./SPRINT-EARLY-ERROR-CAPTURE.research.md)
> **Owner directive**: do NOT revert. Diagnose, plan, pick the surgical fix.

## Problem Statement

Commit `7b4072aa fix(desktop): route webview errors to stderr + JSONL when F12 is dead` added three independent diagnostic layers:

1. **Inline `<script>` in `app.html`** — wraps `console.error`, registers window `error` (capture phase) + `unhandledrejection` listeners; pushes to `window.__DEVPULSE_EARLY_ERRORS__`.
2. **`drainEarlyErrors()` in `logger.ts`** — reads the array into the IPC log buffer when `markIpcReady()` fires.
3. **`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--enable-logging=stderr --v=1`** in `lib.rs` — makes Chromium pipe its internal logs to the Tauri process's stderr.

After this commit, the Tauri webview no longer mounts the SvelteKit app: `[vite] connected.` still prints, but no Svelte module ever logs anything (verified in two separate runs, 08:47 and 08:16 comparison). Boot reaches READY on the Rust side; the UI stays black. The inline script is the only frontend-layer code change that could interfere with the bundle load chain.

## Ground Truth

- Layers 1 + 2 were intended to be orthogonal. Layer 2 alone (Chromium stderr) works as designed — we see `[vite] connecting...`, `[vite] connected.`, USB/GC lines in the terminal.
- Layer 1 is the suspect. Layer 3 (WEBVIEW2 env var) is not plausibly the cause but is trivially separable.
- `@vite/client` does not wrap `console.error` itself, so there is no conflict between vite and Layer 1 at the console-patch level.
- `hooks.client.ts` calls `console.error` inside SvelteKit's client-error hook; this flows through the Layer-1 wrapper.

## SSOT Map (repeated from research)

| File | Role | Status |
|---|---|---|
| `interfaces/desktop/src/app.html` | Inline pre-module error capture | SUSPECT |
| `interfaces/desktop/src/lib/sys/logger.ts` | `drainEarlyErrors` + `markIpcReady` + `installGlobalHandlers` | Consumer of Layer 1, uncompromised |
| `interfaces/desktop/src-tauri/src/lib.rs` | `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` env var | WORKING AS DESIGNED |
| `interfaces/desktop/src/hooks.client.ts` | SvelteKit handleError hook | Unchanged; calls flow through Layer 1 |
| `interfaces/desktop/src/routes/+layout.svelte` | Calls `installGlobalHandlers()` on mount | Unchanged |

---

## Phase 1 — Owner Decisions (BLOCKING)

No code is written until these are answered.

### STOP — Decision 1: Which option?

Options (see research doc for full rationale):

| ID | Description | Preferred for |
|---|---|---|
| **A** | Remove only the `console.error` wrapper from the inline script | You still want window-level error/rejection capture pre-logger but suspect the console wrap |
| **B** | Change `addEventListener('error', ..., true)` → `false` (bubble phase) | Want to keep everything but hand the browser first crack at errors |
| **C** | Remove the inline script entirely; rely on Chromium stderr (Layer 2) | Accept that pre-module capture happens at the process stderr level only |
| **D** | Wrap `origErr.apply(...)` in its own try/catch | Defensive-only; keeps every functional behavior |
| **E** | Compose A + B + D | Safest minimal surgery; keeps the diagnostic idea but strips all three suspected interference paths |
| **F** | Full revert of `7b4072aa` | You want zero diagnostic risk; debug the UI with Chromium F12 only |

**Recommendation**: **E** (compose A + B + D). Each change is surgical and addresses one of the three concrete interference hypotheses. If E still does not let Svelte mount, the remaining suspect is the `drainEarlyErrors()` path in `logger.ts`, which we would revert separately.

### STOP — Decision 2: Verify after fix

- **(i)** `cargo xtask run-dev` and watch for `[layout] Root layout mounted` in Chromium stderr within 15 s of `[vite] connected.`
- **(ii)** Additionally inject a synthetic `throw new Error('probe')` somewhere in a Svelte module to exercise Layer 1 and confirm a `frontend:early:error` entry appears in `session-*.jsonl`
- **(iii)** Both

**Recommendation**: **(iii)**. (i) confirms Svelte mounts; (ii) confirms the remaining Layer-1 path still functions when something actually errors.

### STOP — Decision 3: Commit shape

- **(a)** Single commit for the whole fix (amend `7b4072aa` not possible — it is pushed; instead a new `fix(desktop): …` commit on top)
- **(b)** One commit per option-letter in the fix (so any one can be reverted cleanly)

**Recommendation**: **(a)** for option C or F (single-change options); **(b)** for option E (so each of A/B/D can be reverted independently later).

---

## Phase 2 — Execution Plans (conditional on decisions)

### If Decision 1 = A (remove console.error wrapper only)

1. Edit `interfaces/desktop/src/app.html`:
   - Delete the `const origErr = console.error; console.error = (...args) => { ... };` block (lines 52-63 inclusive).
   - Leave the window `error` and `unhandledrejection` listeners intact.
2. Edit `interfaces/desktop/src/lib/sys/logger.ts::drainEarlyErrors`:
   - Remove the `"console.error"` arm from the `kind` discriminator (type declaration) and from the mapping (`frontend:early:console` is no longer produced).
3. `pnpm svelte-check` — must pass 0/0.
4. `cargo check -p devpulse_desktop_backend` — must pass 0 errors.
5. Commit: `fix(desktop): remove console.error wrapper from app.html inline script (unblocks Svelte bundle load — H2)`.

### If Decision 1 = B (capture phase → bubble phase)

1. Edit `interfaces/desktop/src/app.html`:
   - Change the third argument on `window.addEventListener('error', ..., true)` from `true` to `false`.
2. `pnpm svelte-check` — must pass.
3. Commit: `fix(desktop): change app.html error listener from capture to bubble phase (H1)`.

### If Decision 1 = C (remove inline script entirely)

1. Edit `interfaces/desktop/src/app.html`:
   - Delete the entire `<script>...</script>` block (lines 24-65) and the HTML comment above it (lines 9-23).
2. Edit `interfaces/desktop/src/lib/sys/logger.ts`:
   - Delete the `EarlyErrorEntry` interface (lines 34-42).
   - Delete the `declare global { interface Window { ... } }` block (lines 44-49).
   - Delete `drainEarlyErrors()` (lines 58-92).
   - Remove the `drainEarlyErrors()` call from `markIpcReady()` (line 121).
   - Remove the `window.__DEVPULSE_LOGGER_READY__ = true` line from `installGlobalHandlers()` (line 153).
3. `pnpm svelte-check` — must pass.
4. `cargo check -p devpulse_desktop_backend` — must pass.
5. Commit: `fix(desktop): remove app.html inline early-error script (relies on WEBVIEW2 stderr for pre-logger capture)`.

### If Decision 1 = D (wrap origErr.apply)

1. Edit `interfaces/desktop/src/app.html` around line 62:
   ```diff
   -          return origErr.apply(console, args);
   +          try { return origErr.apply(console, args); } catch (_) { /* swallow */ }
   ```
2. `pnpm svelte-check` — must pass.
3. Commit: `fix(desktop): guard origErr.apply in app.html inline wrapper (H3)`.

### If Decision 1 = E (A + B + D composed)

Execute A, B, D as three separate commits on top of HEAD, in that order. Each commit must:
- Compile clean (`pnpm svelte-check`, `cargo check -p devpulse_desktop_backend`)
- Be independently revertable

### If Decision 1 = F (full revert)

1. `git revert 7b4072aa`.
2. Resolve any trivial conflicts.
3. Commit the auto-generated `Revert "..."` message with a one-line explanation.

---

## Phase 3 — Verification (all paths converge here)

After the chosen commit(s):

1. **Rebuild and run**: `cargo xtask run-dev`
   - Expected: `[+NN.NNNs] [READY] All critical services confirmed` fires within ~10 s of process start
   - Expected: within ~15 s of `[vite] connected.`, Chromium stderr prints at least `[layout] Root layout mounted` and `[boot] platformState.init() starting`
2. **If Decision 2 includes (ii)** — inject a probe:
   - Add `throw new Error('SPRINT-EARLY-ERROR-CAPTURE probe');` at the top of a Svelte module that runs early (e.g., `hooks.client.ts`)
   - Rebuild; run
   - Confirm an entry appears in the newest `session-*.jsonl` with target matching `frontend:*` containing the probe string
   - Remove the probe; rebuild
3. **Commit** the fix (not the probe).

## Anti-Pattern Guards During Execution

- Do NOT touch `e3fc157e` (DevForge lazy-start) or `b9c7672d` (autoload removal). Those commits are orthogonal and the current investigation has no evidence they are involved.
- Do NOT add more `console.*` wrappers anywhere in the fix. If the current wrapper chain is suspect, adding more wrappers is the wrong direction.
- Do NOT run `biome --write` / `--fix` at any point. Manually fix any lint finding.
- Do NOT claim "Done" until `pnpm svelte-check` and `cargo check -p devpulse_desktop_backend` both exit 0 AND the verification run shows Svelte mounted.

## Parking Lot (out of scope)

- `invoke("log", ...)` calls not reaching Rust JSONL even when Svelte mounts — separate log-routing bug. Address AFTER this sprint resolves the UI-mount problem.
- FIN_WAIT_2 socket on :1420 observed mid-hang — likely a consequence, not a cause. Re-investigate if it persists after Svelte mounts.
- Release-mode loss of Layer 2 (env var gated on `debug_assertions`) — decide whether to surface a release-mode toggle separately.

## Authorship Protocol

- Research doc written BEFORE any code change — satisfied.
- Every involved file read in full BEFORE the plan — satisfied (see research doc "Files Read In Full").
- Max 5 files per phase — satisfied (each option touches ≤ 2 files).
- `cargo check -p <crate>` after every file edit — MANDATORY in execute step.
- No biome `--fix` / no suppressed warnings.

## Awaiting Owner

**Nothing executes until Decisions 1, 2, 3 are answered.**
