# Mistake Patterns — Self-Improving Loop
# When Claude makes a repeated mistake, add it here.
# CLAUDE.md @imports this file. Claude reads it every session.
# Format: pattern, prevention, count, first seen.
# At 3 occurrences, promote to .claude/rules/ for enforcement.

### [2026-04-07] missed-verification
**Pattern:** Claimed "0 errors" on `cargo check -p devpulse-engine` but never checked the actual Tauri backend crate (`devpulse_desktop_backend`). Library crates pass but the final binary crate that pulls everything together had 3 errors. REPEATED 2026-04-23 when editing `tauri.windows.conf.json` and verifying only xtask — the backend's `build.rs` invokes tauri-build which reads the merged config at compile time, so a broken config there fails the backend compile even though xtask is green.
**Prevention:** ALWAYS verify with `cargo check -p devpulse_desktop_backend` — that is what `xtask run-dev` compiles. Library crate checks are insufficient. Also applies to ANY edit under `interfaces/desktop/src-tauri/*.conf.json` including per-OS overrides; xtask doesn't invoke tauri-build so xtask green proves nothing about config validity.
**Count:** 2 — promote to .claude/rules/ on next occurrence | **First seen:** 2026-04-07 | **Repeated:** 2026-04-23

### [2026-04-07] missed-verification
**Pattern:** Skipped `biome check` after frontend edits. Reported "all gates pass" without running the formatter/linter. 7 formatting errors existed.
**Prevention:** After ANY frontend edit: `npx biome check src/lib/domains/app/models/ --diagnostic-level=warn`. Add to verification checklist alongside svelte-check.
**Count:** 1 | **First seen:** 2026-04-07

### [2026-04-07] wrong-pattern
**Pattern:** Used forked ort API with field access (`.inputs`, `.name`) instead of method calls (`.inputs()`, `.name()`). The fork has private fields with accessor methods. Then used `&i.name()` which creates a reference to a temporary.
**Prevention:** The forked ort at `deps/ort/` uses method accessors, not public fields. Pattern: `session.inputs().iter().map(|i| i.name())` — no `&` on method return values that return owned types.
**Count:** 1 | **First seen:** 2026-04-07

### [2026-04-07] wrong-pattern
**Pattern:** Changed `format!("{:?}", s.status)` to `s.status.to_string()` for `BudgetStatus` without checking if `Display` was implemented. `ModelStatus` had Display (I added it) but `BudgetStatus` is a DIFFERENT type in a DIFFERENT module.
**Prevention:** When replacing `format!("{:?}")` → `.to_string()`, grep for `impl.*Display.*{TypeName}` FIRST. If no Display impl exists, add one before changing the call site.
**Count:** 1 | **First seen:** 2026-04-07

### [2026-04-23] tauri-build-map-form-bug
**Pattern:** Converted `tauri.windows.conf.json` `bundle.resources` from list form (array) to map form (object) with `""` targets for 10 DLL entries and a `"devforge/"` target for a glob. tauri-build fails mid-iteration emitting `The system cannot find the path specified. (os error 3)` despite Tauri 2 docs claiming `""` targets are valid. HEAD's list form compiles fine. Linux/macOS configs use map form successfully — Windows-specific tauri-build bug.
**Prevention:** For Windows `tauri.windows.conf.json` `bundle.resources`, keep LIST form. To express a renamed target (e.g. `resources/devforge/win32-x64/` → `<resource>/devforge/`), apply the rename in the xtask packager instead of in the Tauri config. See `apply_portable_layout_policy` in `xtask/src/commands/package_portable.rs`.
**Count:** 1 | **First seen:** 2026-04-23

