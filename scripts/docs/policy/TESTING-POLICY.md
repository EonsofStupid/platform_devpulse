# DevPulse Testing Policy

> **Status**: LOCKED 2026-04-11
> **Scope**: every crate and every package in this repo
> **Authority**: this file is the SSOT for where tests live, what they're allowed to touch, and what's banned.

---

## The layered model (five layers, no others)

Tests live in exactly one of five places. The place is a function of **what the test is exercising**, not what's convenient. Wrong place = delete and re-file.

| # | Layer                     | Where                                                | What it exercises                                    | Allowed to touch                          | Banned                              |
|---|---------------------------|------------------------------------------------------|------------------------------------------------------|-------------------------------------------|-------------------------------------|
| 1 | **Unit**                  | `<crate>/src/**/*.rs` under `#[cfg(test)] mod tests` | Pure logic, one function, one decision path         | Pure Rust, no I/O, no FFI, no time        | Filesystem, network, FFI, threads   |
| 2 | **Crate integration**     | `<crate>/tests/*.rs`                                 | The crate's **public API only**, end-to-end         | Real files, real FFI, real threads, real time | Reaching into another crate's private modules |
| 3 | **Facade smoke**          | `systems/devpulse-engine/tests/*.rs`                 | The engine facade — the public boundary desktop + MCP cross | Everything a crate-integration test can, plus reaching across kernel crates through the facade | Poking desktop IPC directly       |
| 4 | **Frontend component**    | `interfaces/desktop/src/**/*.test.ts` (vitest-browser) | Svelte component + runes + DOM in real Chromium    | Real DOM, real runes, real events, real fetch | Reaching across Tauri IPC — stub `@tauri-apps/api/core` at the module boundary |
| 5 | **End-to-end (Tauri)**    | `interfaces/desktop/e2e/*.spec.ts` (Playwright)      | A running Tauri webview, full stack                 | Everything: real webview, real Rust, real files, real models | Stubs of any kind. If it needs a stub, it belongs in layer 4 |

**The rule**: start at the lowest layer that can answer the question you're asking. Don't write an E2E to check a pure function. Don't write a unit test for something that only breaks when two crates meet.

---

## Why each layer exists (and why none of them can absorb another)

### Layer 1 — Unit
Fast, no setup, no native libs. Runs hundreds per second under `cargo test -p <crate> --lib`. If you can answer the question without touching a file or calling FFI, this is where you are. Anything slower than this is a waste here and belongs in layer 2+.

### Layer 2 — Crate integration
Rust's `tests/` directory compiles each file as a **separate binary** that only links against the crate's public API. That's the point: it catches "this works when I call it from inside, breaks when I call it from outside" bugs (visibility, feature gates, default features, re-exports). **FFI and real filesystem access live here**, because:

- Feature gates like `#[cfg(feature = "candle-backend")]` are only honored by the real public API surface, not by `#[cfg(test)]` internals.
- Native libraries (llama.cpp, candle, whisper.cpp) need the crate's real link settings, not a test-only build.
- `cargo test -p <crate> --test <name>` runs this file in isolation — CI can shard them.

**Example**: `kernel/model-loader/tests/real_loader_smoke.rs` (see this policy's companion test).

### Layer 3 — Facade smoke
`devpulse-engine` is the boundary every external consumer crosses. Desktop, MCP, eventually the lab observer — all of them call `devpulse_engine::platform::*`. A test at this layer catches:

- "slot config parses in kernel but engine never loads it"
- "kernel emits event, engine bridge drops it"
- "engine command accepts the request, kernel refuses it"

Integration-per-kernel-crate (layer 2) can't catch these because each kernel crate is isolated. E2E (layer 5) can't catch them efficiently because you'd have to spin up the whole desktop window. Facade smoke is the only layer where the engine's public contract is exercised as a unit.

### Layer 4 — Frontend component
vitest-browser loads the Svelte file into **real Chromium via Playwright**. Runes run. The real DOM mutates. Real click events fire. Real focus/tab/keyboard reach the handlers. The `$effect` queue runs. This is the layer to answer "when I click this button, does the right thing render".

The one module that **has to be stubbed** is `@tauri-apps/api/core`. Chromium does not have `window.__TAURI_INTERNALS__` — calling `invoke()` throws "Cannot read properties of undefined". The stub is at the transport layer only: the real component is mounted, the real event handlers fire, the real state updates. Only the final step — the IPC wire — is replaced with a resolved Promise that returns a fixture. **This is not "mocking the component". The component is real.** If something else needs to be replaced to make a test pass, the test belongs in layer 5.

### Layer 5 — End-to-end (Tauri)
Playwright drives a real Tauri webview via the CDP endpoint that Tauri 2 can expose when built with the debug WebView2 flag. No stubs. Real Rust commands. Real model files on disk. Real llama.cpp / candle / whisper.cpp. This is the only layer where "the user clicks the button, a real GGUF loads, a progress bar moves" can be verified as a single atomic assertion.

It is slow. It is the last resort. If a layer-4 test can answer the question, layer-5 is overkill and shouldn't be written. If the question can **only** be answered at layer 5, layer 5 is mandatory — no shortcuts via layer-4 stubs that pretend to answer it.

---

## What each layer is BANNED from

- **Layer 1** — no `std::fs`, no `tokio::spawn_blocking`, no `std::thread::spawn`, no `std::time::SystemTime::now()`, no FFI calls, no `Ctrl+F "sleep"`.
- **Layer 2** — no reaching across crates through private modules. If a test needs something private from another crate, the architecture is wrong, not the test.
- **Layer 3** — no direct Tauri `invoke`, no WebviewWindow manipulation. The engine facade is the ceiling.
- **Layer 4** — no `vi.mock('$lib/domains/**/...')`. You render the real component. Stubs are confined to `@tauri-apps/api/core` and its aliases, nothing deeper.
- **Layer 5** — no stubs, no "for testing purposes we just …". If the answer is no, the answer is no.

---

## What to run, and when

```bash
# Layer 1 + 2 for a specific crate (fast, runs on every save in watch)
cargo test -p model-loader

# Layer 1 + 2 + 3 (medium, runs on every pre-push)
cargo test --workspace

# Feature-gated layer 2 (when the test needs a native lib)
cargo test -p model-loader --features inference --test real_loader_smoke -- --nocapture

# Layer 4 (fast in headless, slow if you actually watch it in headed mode)
cd interfaces/desktop
pnpm test:browser                       # watch, headed Chromium
pnpm test                                # CI, headless

# Layer 5 (slow, requires the Tauri dev build to be running)
cd interfaces/desktop
pnpm test:e2e                            # CLI
pnpm test:e2e:ui                         # Playwright inspector
```

---

## Feature gates: when a layer-2 test needs native libs

Real FFI tests **must** be feature-gated so `cargo test -p <crate>` by default still runs in seconds. Pattern:

```rust
// kernel/model-loader/tests/real_loader_smoke.rs

#![cfg(feature = "inference")]

//! Real loader smoke test — loads actual model files through the real
//! backend pool. Feature-gated so the default `cargo test` path stays
//! fast. CI runs this separately via
//! `cargo test -p model-loader --features inference --test real_loader_smoke`.

// ... test body ...
```

Then CI has one job that runs the default workspace tests and a second that adds `--features inference` for the native-backed paths. The two never step on each other.

---

## Absolute rules

1. **No "for this test only" code changes in production source.** Tests adapt to the code, not the other way around. If the public API can't be tested, the public API is the problem.
2. **No `#[ignore]` without a comment explaining why and a linked issue.** An ignored test is a lie you pay rent on.
3. **No commented-out tests.** Delete it or fix it.
4. **No test reaching up a layer.** A crate-integration test that tries to drive a Tauri command is in the wrong layer. Move it or delete it.
5. **Tests that sleep are broken by definition.** If you need to wait for something async, wait for the signal, not the clock.
6. **Every layer-2/3/5 test that touches real files declares the file paths it depends on in a doc comment.** If `.userdata/models/foo.gguf` disappears, the test should say so out loud, not hang.

---

## How this doc is maintained

- This file is SSOT. Sprint docs that contradict it are wrong and get updated.
- If a new layer is proposed, it's proposed here first, merged, then anyone can write a test in it.
- Changes to this file require the owner's sign-off because the layered model is a load-bearing architecture decision, not a style preference.
