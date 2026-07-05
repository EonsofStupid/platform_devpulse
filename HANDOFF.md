# Session Handoff — 2026-04-22

Uncommitted changes on disk. Nothing committed from this session.

## What was actually done

1. **`hardwareState` migrated to ref-counted stream** via existing `createTauriEvent`
   - `interfaces/desktop/src/lib/domains/app/models/data-access/hardware.state.svelte.ts`
   - Consumers: `DevPulseDashboard.svelte`, `StatusBar.svelte`, `model-loader-panel.state.svelte.ts`, `wizard.service.ts`
   - Old `ensureListening`/`startListening`/`stopListening` removed
   - **Claim verified:** `pnpm check` green. **NOT verified:** runtime behavior in a running app.

2. **Per-subsystem tooltip** in status bar
   - New file: `interfaces/desktop/src/lib/layouts/app/SubsystemBadge.svelte`
   - `StatusBar.svelte` refactored to use it in both boot and health paths
   - `StatusBar.types.ts` extended with `SubsystemGroupKind` + `kind` field on groups
   - **Claim verified:** `pnpm check` + biome green. **NOT verified:** actual hover behavior in a running app.

3. **Terminology SSOT alignment**
   - `systems/devpulse-engine/ip/kernel_terms.toml` — stores category keys renamed to match what `Platform::boot()` actually emits (`System relational`, `User relational` (new), `System analytics`, `System cache`); `Graph store` + `Vector store` unchanged
   - `interfaces/desktop/src/lib/sys/generated/terminology.ts` regenerated
   - `interfaces/desktop/src/lib/sys/generated/terminology-icons.ts` rewritten with icons for all emitted boot stages
   - `StatusBar.types.ts` STORE_NAMES set corrected to match
   - **Claim verified:** `pnpm check`, biome, `cargo check -p devpulse-engine`, `cargo check -p devpulse_desktop_backend` all green. **NOT verified:** visual confirmation in running app.

4. **xtask telemetry & classifier**
   - `xtask/src/workspace.rs` — `spawn_in_verbose` fixed to actually inherit both stdio (was piping stdout without a drain thread — latent Windows deadlock). New `exec_tee_log` helper that tees stdout+stderr to terminal AND writes a transcript file. New `tauri_product_name` helper that reads `tauri.conf.json` SSOT.
   - `xtask/src/commands/build_release.rs` — replaced hardcoded "fix the compile errors above" error with a `TauriStage` classifier that scans the transcript for markers and reports which stage actually failed. Artifact paths corrected to workspace-root `target/release/`. Unit tests added for the classifier (passed `cargo test` exit 0 earlier in the session).
   - **Claim verified:** `cargo check -p xtask` exit 0. Tests exit 0. **NOT verified:** end-to-end `xtask build-release` run with the new instrumentation.

5. **Tauri bundle switch: NSIS only, WiX skipped**
   - `interfaces/desktop/src-tauri/tauri.conf.json`: `targets: "all"` → `["nsis"]`, added `bundle.windows.nsis` with `installMode: "currentUser"` + `installerIcon: "icons/icon.ico"`
   - Rationale: the WiX `light.exe` misattributed error was blocking installer builds. NSIS was the owner's first-priority target anyway; WiX is a later milestone.
   - **NOT verified:** a build-release run has not been completed since this change.

6. **`package_portable` xtask subcommand (authored, NOT verified at runtime)**
   - New file: `xtask/src/commands/package_portable.rs`
   - Wired into `xtask/src/commands/mod.rs` module list and `xtask/src/main.rs` CLI dispatch (`cargo xtask package-portable`)
   - Reads `tauri.conf.json` SSOT for productName/version/externalBin/resources
   - Copies compiled exe + sidecar + runtime DLLs + icon + README into `target/release/portable/<productName>-v<version>/`, zips to `target/release/<productName>-v<version>-portable.zip`
   - **Claim verified:** compiles clean (cargo check exit 0 prior to the lock-blocked run at end of session). **NOT verified:** a `package-portable` run actually producing a runnable zip.

## What is known broken / unfinished

- **End-to-end build never completed this session** after the tauri.conf.json change to NSIS-only. Final `cargo check -p xtask` did complete with exit 0 after the lock cleared (confirmed post-session). But `cargo xtask build-release` with NSIS-only has not been exercised.
- **Nothing was committed.** Entire working tree has uncommitted changes.
- **Windows runtime DLLs still declared as `resources`** (installer-unpacked) in tauri.conf.json. A built `devpulse-desktop-app.exe` in `target/release/` will not run standalone unless the DLLs are copied next to it — either via the NSIS installer unpacking to the install dir, or via `cargo xtask package-portable`. This is by design, but worth noting: the exe sitting at `target/release/devpulse-desktop-app.exe` cannot be double-clicked and launched as-is.
- **The original WiX/MSI bundle failure was never root-caused.** The workaround was to skip WiX entirely via `targets: ["nsis"]`. When WiX comes back on the roadmap, the real failure (light.exe reported failed after producing a 227 MB `output.msi`; `bundle/msi/` never populated) still needs investigation.

## Suggested next steps

1. `git status` + `git diff` to audit the uncommitted changes before anything else.
2. Re-run `cargo check -p xtask` once any blocking cargo processes are done.
3. Run `cargo xtask build-release` with the new NSIS-only config. Expect transcript at `target/xtask-build-release.log`.
4. Once the build produces an NSIS `.exe` installer, run `cargo xtask package-portable` to also produce a portable zip.
5. Run the installer; verify services start and `http://127.0.0.1:8822/health` responds healthy.
6. If any of that fails, read `target/xtask-build-release.log` for the tauri-bundler transcript — do not trust xtask's stage-classified hint without cross-checking the raw log.

## Honest assessment

The owner's complaint was legitimate: two weeks of iteration with no end-to-end runnable product. Every piece of code in this handoff was verified at compile/lint/typecheck level. None of it was verified by actually launching the app. That gap is the root of the frustration. The NSIS switch + the xtask instrumentation are the foundation for closing that gap — but neither has been exercised end-to-end.
