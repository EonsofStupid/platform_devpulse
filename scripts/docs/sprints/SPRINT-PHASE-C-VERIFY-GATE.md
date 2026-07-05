# SPRINT: Phase C — `cargo xtask verify` Expansion + Lefthook pre-push Test Gate

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: READY (STOPs G/H/I answered — G1 cargo xtask verify / H2 pre-push / I2 aggregator)
> **Scope**: **M** — 2 Rust files edited, 1 lefthook section edited, 1 doc.
> **Prerequisite**: Phase 0d (VERIFICATION.md — this sprint populates its §3).
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

One command — `cargo xtask verify` — that runs the full local gate:

1. `cargo fmt --all -- --check`
2. `cargo clippy --workspace -- -D warnings`
3. `cargo check --workspace`
4. svelte-check (`pnpm check`)
5. biome (`pnpm lint`)
6. vitest unit run (`pnpm test:run`)
7. no-raw-invoke scan (`pnpm check:ipc`)

PLUS adds `cargo test --workspace --lib` to **lefthook pre-push** (not pre-commit — Q-H2) so broken tests are blocked before they hit remote but commit velocity is preserved.

Both entry points converge on the same gate — `cargo xtask verify` is what the owner runs manually; lefthook runs slices of it automatically.

---

## Decisions Locked

| ID | Decision | Rationale |
|---|---|---|
| Q-G / G1 | `cargo xtask verify` — Rust-hosted aggregator | Matches existing xtask pattern. Works from any terminal. Cross-platform. |
| Q-H / H2 | `cargo test --workspace --lib` in pre-push only | Preserve commit velocity; broken state stopped before push. |
| Q-I / I2 | Yes, author the aggregator even though lefthook is extensive | One entry point beats remembering which lefthook alias to run. |

---

## SSOT Map

| File | Current state | Phase C action |
|---|---|---|
| [xtask/src/commands/verify.rs](xtask/src/commands/verify.rs) | Exists, 76 LOC. Runs `pnpm svelte-check` + `cargo check --workspace` in parallel. | EXPAND into full gate — add fmt/clippy/test groups, frontend lint + unit test, ipc scan. Keep parallel-where-safe pattern. |
| [xtask/src/commands/mod.rs](xtask/src/commands/mod.rs) | Already registers `Verify` task | No change unless new sub-commands added. |
| [lefthook.yml](lefthook.yml) | `pre-push` has clippy + cargo-deny + svelte-check | ADD `cargo-test-lib` command running `cargo test --workspace --lib`. |
| `scripts/docs/VERIFICATION.md` (from Phase 0d) | Already references `cargo xtask verify` under §3 | Confirm the doc matches what ships here. Update if divergent. |

## Duplication Scan

- `verify.rs` already exists — expand, don't replace.
- No existing `xtask verify-full` or `xtask ci` competing subcommand (`ls xtask/src/commands/`).
- `pre-commit` lefthook hooks already cover: rust-fmt, rust-check, svelte-check, ip-boundary-check, no-legacy-prefixes, biome-lint, no-raw-values, docs-preflight, tokens-regen, coldlight-verify, coldlight-docs — `cargo xtask verify` is a superset, NOT a replacement. Pre-commit stays pre-commit.
- `pre-push` has clippy + cargo-deny + svelte-check already. Phase C adds one command (`cargo-test-lib`). No overlap.
- `pnpm test:run` runs vitest — `vitest --browser` is a separate script (not invoked).

## Files (3 edits, 1 doc confirm)

### 1. `xtask/src/commands/verify.rs` — expanded aggregator

Structure:

```rust
impl Task for Verify {
    fn run(&self, ws: &Workspace) -> anyhow::Result<()> {
        stage::section("Verify");

        // ── Group 1 (parallel) — fast checks ─────────
        let fmt_child = ws.spawn_in(ws.root(), "cargo", &["fmt", "--all", "--", "--check"])?;
        let check_child = ws.spawn_in(ws.root(), "cargo", &["check", "--workspace"])?;
        let svelte_child = ws.spawn_in_verbose(&ws.desktop_dir(), "pnpm", &["svelte-check"])?;

        // Wait + report each
        check_stage("cargo fmt --check", fmt_child)?;
        check_stage("cargo check --workspace", check_child)?;
        check_stage("pnpm svelte-check", svelte_child)?;

        // ── Group 2 (parallel) — slow checks ─────────
        let clippy_child = ws.spawn_in(ws.root(), "cargo", &[
            "clippy", "--workspace", "--", "-D", "warnings"
        ])?;
        let biome_child = ws.spawn_in_verbose(&ws.desktop_dir(), "pnpm", &["lint"])?;
        let ipc_child = ws.spawn_in_verbose(&ws.desktop_dir(), "pnpm", &["check:ipc"])?;

        check_stage("cargo clippy -D warnings", clippy_child)?;
        check_stage("pnpm lint (biome)", biome_child)?;
        check_stage("pnpm check:ipc", ipc_child)?;

        // ── Group 3 — vitest unit run ────────────────
        let vitest_child = ws.spawn_in_verbose(&ws.desktop_dir(), "pnpm", &["test:run"])?;
        check_stage("pnpm test:run (vitest)", vitest_child)?;

        // ── NOT included (by design):
        //  - cargo test — runs in lefthook pre-push only (Q-H2)
        //  - playwright — requires app running
        //  - cargo deny — runs in pre-push (network fetch)

        println!();
        println!("  All checks passed.");
        Ok(())
    }
}

fn check_stage(name: &str, child: Child) -> anyhow::Result<()> {
    let stage = Stage::start(name);
    let status = child.wait_with_output()
        .map_err(|e| anyhow::anyhow!("{name} wait failed: {e}"))?;
    if status.status.success() {
        stage.ok();
        Ok(())
    } else {
        stage.fail(&format!("{name} failed"));
        // Print last N lines of stderr
        let stderr = String::from_utf8_lossy(&status.stderr);
        for line in stderr.lines().rev().take(40).collect::<Vec<_>>().into_iter().rev() {
            eprintln!("         {line}");
        }
        anyhow::bail!("{name} failed")
    }
}
```

Key traits:
- Parallel where independent (group 1 fast, group 2 slow).
- Serial only where output order matters (vitest).
- Fail-fast per group but report all failures in a group.
- Always surface last 40 stderr lines of the failing stage.

### 2. `lefthook.yml` — add `cargo-test-lib` to pre-push

```yaml
pre-push:
  parallel: true
  commands:
    # Full Rust lint on push
    clippy:
      glob: "*.rs"
      run: cargo clippy --workspace -- -D warnings

    # Security audit
    cargo-deny:
      run: cargo deny check advisories

    # Svelte type check
    svelte-typecheck:
      root: "interfaces/desktop"
      run: pnpm exec svelte-check --threshold error

    # Rust unit tests — NEW (Q-H2)
    cargo-test-lib:
      glob: "*.rs"
      run: cargo test --workspace --lib
```

### 3. `scripts/docs/VERIFICATION.md` — confirm §3 matches

Phase 0d stubbed the section. Phase C writes the exact commands that ship:

```markdown
## 3. cargo xtask verify

One command, all gates:
    cargo xtask verify

Runs:
  1. cargo fmt --check                    [group 1 / parallel]
  2. cargo check --workspace              [group 1 / parallel]
  3. pnpm svelte-check                    [group 1 / parallel]
  4. cargo clippy --workspace -D warnings [group 2 / parallel]
  5. pnpm lint (biome)                    [group 2 / parallel]
  6. pnpm check:ipc                       [group 2 / parallel]
  7. pnpm test:run (vitest)               [group 3 / serial]

Target: <45s incremental on warm cache.

NOT included (by design):
- cargo test --workspace — runs in lefthook pre-push only.
- playwright — requires a running app.
- cargo deny check advisories — runs in pre-push (network fetch).

Fail: prints last 40 stderr lines of the failing stage + stops the run.
```

## Execution Order

1. **Expand `verify.rs`**. `cargo check -p xtask` green. `cargo xtask verify` on a clean tree exits 0.
2. **Deliberate fail** — introduce a `cargo clippy` warning, re-run, confirm exit 1 + stderr tail printed.
3. **Edit `lefthook.yml`** — add `cargo-test-lib` to pre-push. `lefthook run pre-push` runs successfully on a clean tree.
4. **Edit VERIFICATION.md §3** — confirm exact commands match implementation.
5. Commit: `feat(xtask): expand verify to full local gate + pre-push cargo test (Phase C)`.

## Verification Gate

- [ ] `cargo xtask verify` exits 0 on a clean tree.
- [ ] Introducing a known-bad change (e.g. `let x: i32 = "string";`) causes `cargo xtask verify` to exit 1 with the Rust error in the last 40 stderr lines.
- [ ] `lefthook run pre-push` passes on a clean tree.
- [ ] `lefthook run pre-push` fails if a test is made to fail (e.g. `panic!("test")` in a `#[test]`), and the failure is reported.
- [ ] `cargo xtask verify` runtime <45s on warm cache (measure with `time cargo xtask verify`).
- [ ] VERIFICATION.md §3 matches the shipping command list.

## Do NOT Touch

- `pre-commit` hooks — they stay as-is (biome, svelte-check, ip-boundary, etc.).
- `cargo deny` — stays in pre-push only, not in `xtask verify` (network fetch).
- `playwright` — needs a running app, not suited for pre-push.
- `vitest --browser` — slower than headless vitest, not in the gate.
- Other xtask subcommands (`dev`, `deps`, `fetch_devforge`, etc.) — untouched.

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Making `xtask verify` slower by running everything in serial | Groups 1 + 2 run in parallel; only vitest is serial. |
| Including `cargo test` in the `xtask verify` default AND pre-push | Q-H2: pre-push only. `xtask verify` stays under 45s. Owner runs `cargo test` manually when relevant. |
| Adding `cargo deny check` to `xtask verify` | Network-bound, flaky. Stays in pre-push only. |
| Failing silently | `check_stage` bails with stderr tail on any failure. |
| Running the expanded verify without regenerating bindings | If Phase A or B left bindings stale, svelte-check catches it. Fix by running the dev build to regen before verify. Document in VERIFICATION.md. |
| Forgetting to stage_fixed on generated files | Lefthook `tokens-regen` already handles this. Not a Phase C concern. |

## Future Follow-Ups (NOT in this sprint)

- CI pipeline (GitHub Actions / similar) — calls `cargo xtask verify` + playwright + cargo deny. Separate sprint.
- Playwright gate tied to a `cargo xtask verify:full` subcommand. Separate sprint.
- Turbo / nx — monorepo orchestration. Out of scope for this platform.
- `cargo nextest` adoption for faster `cargo test` — evaluate, not this sprint.

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Depends on: `SPRINT-PHASE-0D-VERIFICATION-COOKBOOK.md` (§3 reference)
- Existing: [xtask/src/commands/verify.rs](xtask/src/commands/verify.rs), [lefthook.yml](lefthook.yml)
- Blocks: none
