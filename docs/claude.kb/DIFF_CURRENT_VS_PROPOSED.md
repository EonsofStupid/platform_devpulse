# SIDE-BY-SIDE DIFF: Current .claude/ vs Proposed Baselines

| Field | Value |
|-------|-------|
| **Created** | `2026-03-31` |
| **Purpose** | Review before deploying baseline changes |
| **Action** | Jesse reviews, approves per-file, THEN we swap |

---

## 1. CLAUDE.md (ROOT)

| Metric | Current | Proposed | Delta |
|--------|---------|----------|-------|
| Lines | 104 | 52 | -52 (50% reduction) |
| Effective instructions | ~45 | ~40 | -5 (leaner, stronger) |
| Countermeasures | 0 | 11 lines | +11 (CC-001 through CC-009) |
| Frustration handling | 0 | 3 lines | +3 (CC-009 override) |
| @imports | 0 | 4 | +4 (architecture, IP, sprint, mistakes) |

### What was REMOVED (and why):

| Removed content | Why | Where it went |
|----------------|-----|---------------|
| ASCII tree structure (9 lines) | Claude reads filesystem. Redundant. | Deleted — saves 9 instruction slots |
| ColdLight "Core Principles" (7 lines) | Domain-specific → belongs in child CLAUDE.md | Move to interfaces/desktop/CLAUDE.md |
| ColdLight "2-Layer Architecture" (5 lines) | Domain-specific | Move to interfaces/desktop/CLAUDE.md |
| ColdLight "Supporting Systems" (4 lines) | Domain-specific | Move to interfaces/desktop/CLAUDE.md |
| Key Dependencies list (8 lines) | package.json is the SSOT for deps | Deleted — Claude reads package.json |
| Angry inline comment about Melt UI | Emotional, not instructional | Captured in rules/svelte.md properly |
| "Architecture Pattern" section (4 lines) | Vague, not actionable | Condensed to 1-line Stack entry |

### What was ADDED (and why):

| Added content | Why |
|--------------|-----|
| `cargo check -p <crate>` (not full workspace) | Specific. Fast. Current version doesn't say how to verify. |
| `cargo clippy -p <crate>` | Missing entirely from current |
| NO PYTHON hard rule | Claude defaults to suggesting Python. Must be blocked. |
| Candle + llama.cpp + flume in Stack | Claude has zero training signal. Prevents hallucination. |
| libSQL + SurrealDB + DuckDB | Current says "libpq (PostgreSQL)" which is WRONG — you use libSQL |
| 11 countermeasure lines | CC-001 through CC-007 overrides. Didn't exist. |
| Frustration handling | CC-009 override. Didn't exist. |
| @imports for deep docs | Keeps CLAUDE.md lean, links to depth |
| Mistake patterns @import | Self-improving loop |

### What NEEDS REVIEW:

- **ColdLight section was removed.** The current 30+ lines about ColdLight
  should become `interfaces/desktop/src/lib/design/CLAUDE.md` (child file).
  Claude auto-loads it when working in that directory. This recovers ~30
  instruction slots from root CLAUDE.md without losing the content.

- **Sprint Process section was removed.** This should become a skill
  (`/sprint-execute`) rather than always-loaded instructions. Sprint info
  is only relevant during sprints, not every session.

- **"Zod" still referenced in current.** Proposed replaces with ArkType
  in rules/svelte.md. Need to confirm: is Zod fully dropped in the
  ColdLight design context or still used there?

---

## 2. .claude/rules/ FILES

### rust.md

| Metric | Current | Proposed | Delta |
|--------|---------|----------|-------|
| Lines | 13 | 20 | +7 |
| Rules | 4 | 11 | +7 |

| Added rule | Why |
|-----------|-----|
| NEVER suggest Python | Claude's #1 drift for Rust projects |
| Candle is SYNC, bridge via flume | Zero training signal. Will hallucinate tokio::spawn_blocking |
| llama.cpp FFI: Rust→C only | Prevents suggesting Python bindings |
| All forks under EonsofStupid | Prevents `cargo add` from upstream |
| rkyv 0.8.15 PINNED | Security pin. Must not drift. |
| DuckDB/FFmpeg are accepted C deps | Prevents blocking legitimate FFI |
| Compile before testing | G-019 — compiled language gotcha |

**No rules removed.** All 4 originals preserved.

### svelte.md

| Metric | Current | Proposed | Delta |
|--------|---------|----------|-------|
| Lines | 13 | 19 | +6 |
| Rules | 5 | 11 | +6 |

| Added rule | Why |
|-----------|-----|
| ColdLight SOLE AUTHORITY | Currently only in CLAUDE.md (30 lines of it). Condensed to 1 rule. |
| ArkType not Zod | Zod dropped platform-wide. Claude will suggest Zod. |
| Specta + tauri-specta | Type-safe IPC. Claude doesn't know this pattern. |
| NEVER import @melt-ui directly | ColdLight wraps it. Direct import breaks architecture. |
| Not Next.js (no Server Components) | Claude confuses SvelteKit with Next.js App Router |
| No "use client" | Same confusion. React directives don't exist here. |

**No rules removed.** All 5 originals preserved.

### claude-code-countermeasures.md (NEW FILE)

| Metric | Value |
|--------|-------|
| Lines | 35 |
| Purpose | All CC-001 through CC-009 countermeasures in one rule |
| Path scope | None (universal — applies to all files) |
| Overlaps | Partially overlaps CLAUDE.md countermeasures section (intentional reinforcement) |

**This is net new.** No equivalent exists in current .claude/rules/.

### preflight.md (NEEDS TRIM)

| Metric | Current | Proposed | Delta |
|--------|---------|----------|-------|
| Lines | 138 | ~40 | -98 |

**Problem:** 138 lines is eating ~40+ instruction slots BY ITSELF.
This single file may be consuming more budget than CLAUDE.md + all other rules combined.

**What to keep (40 lines):**
- Phase 0: Orient (read-only) — trimmed to essentials
- Phase 1: Declare (before work) — state what you know/don't know
- Phase 2: Execute rules — schema-first, config-driven, verify after each change
- Anti-patterns list — condensed to 5 critical items

**What to MOVE to skills:**
- SurrealDB curl commands (20 lines) → `/preflight-db` skill
- Memory budget priority table → `@.claude/references/memory-budget.md`
- Full anti-patterns list → `@.claude/references/anti-patterns.md`

### ip-protection.md — NO CHANGES NEEDED
52 lines. Well-structured. Kernel term mapping is correct and essential.

---

## 3. settings.json HOOKS

| Hook event | Current | Proposed additions |
|-----------|---------|-------------------|
| PreCompact | ✅ save-state.js | No change |
| UserPromptSubmit | ✅ save-chat.js (async) | + psych-translator.js (CC-009) |
| SessionStart | ✅ restore-memory.js | + context inject (branch, modified files) |
| SessionEnd | ✅ session-end.js | No change |
| PostToolUse (Write\|Edit) | ✅ track-files.js (async) | + auto-format.sh |
| **Stop** | ❌ MISSING | + verify-on-stop.sh (CC-001 — CRITICAL) |
| **PreToolUse (Bash)** | ❌ MISSING | + security gate (pip/docker/rm-rf block) |

### CRITICAL MISSING: Stop hook
This is the single highest-impact addition. Without it, 29-30% of
"Done" claims are false. The employee verification gate you don't have.

### Permissions deny list

| Current deny | Proposed additions |
|-------------|-------------------|
| `Bash(rm -rf /*)` | No change |
| `Bash(git push --force:*)` | No change |
| `Bash(git reset --hard:*)` | No change |
| `Bash(git clean -fd:*)` | No change |
| — | + `Bash(pip install:*)` |
| — | + `Bash(pip3 install:*)` |
| — | + `Bash(python -m pip:*)` |
| — | + `Bash(docker:*)` |

---

## 4. INSTRUCTION BUDGET ANALYSIS

### Current budget usage (ESTIMATED):

| Source | Lines | Est. instructions | % of budget |
|--------|-------|-------------------|-------------|
| System prompt | (hidden) | ~50 | 25% |
| CLAUDE.md | 104 | ~45 | 23% |
| rules/preflight.md | 138 | ~40 | 20% |
| rules/rust.md | 13 | ~4 | 2% |
| rules/svelte.md | 13 | ~5 | 3% |
| rules/ip-protection.md | 52 | ~15 | 8% |
| Skills descriptions | 15 skills | ~20 | 10% |
| **TOTAL** | | **~179** | **~90%** |

**Assessment:** NEAR CEILING. preflight.md + CLAUDE.md together eat 43%
of the budget. Adding ANY new rules risks pushing past the ~200 cliff
where bottom rules get ignored randomly.

### Proposed budget usage:

| Source | Lines | Est. instructions | % of budget |
|--------|-------|-------------------|-------------|
| System prompt | (hidden) | ~50 | 25% |
| CLAUDE.md | 52 | ~35 | 18% |
| rules/countermeasures.md | 35 | ~20 | 10% |
| rules/preflight.md (trimmed) | 40 | ~15 | 8% |
| rules/rust.md | 20 | ~11 | 6% |
| rules/svelte.md | 19 | ~11 | 6% |
| rules/ip-protection.md | 52 | ~15 | 8% |
| Skills descriptions | 15 skills | ~20 | 10% |
| **TOTAL** | | **~177** | **~89%** |

**Assessment:** Same total but BETTER DISTRIBUTED. Countermeasures added.
Bloat removed. Budget headroom for ~20 more instructions if needed.

The real win: preflight.md drops from 40% to 15% of non-system budget,
freeing ~25 instruction slots that were being wasted on SurrealDB curl
commands loaded every session whether needed or not.

---

## 5. DEPLOYMENT ORDER

Do NOT swap everything at once. Incremental, verified.

| Step | What | Risk | Verify |
|------|------|------|--------|
| 1 | Add `rules/claude-code-countermeasures.md` | LOW (net new, doesn't replace anything) | `/memory` shows it loaded |
| 2 | Add Stop hook (verify-on-stop.sh) | LOW (net new) | Make an edit, see if verification runs on stop |
| 3 | Add psych-translator.js hook | LOW (net new, UserPromptSubmit) | Swear at Claude, see if response is direct not apologetic |
| 4 | Add pip/docker deny rules to settings.json | LOW (net new) | Try `pip install x`, should be blocked |
| 5 | Update `rules/rust.md` (4→11 rules) | LOW (additive) | `/memory` verify, test Rust task |
| 6 | Update `rules/svelte.md` (5→11 rules) | LOW (additive) | `/memory` verify, test Svelte task |
| 7 | Trim `preflight.md` (138→40) | MEDIUM (removing content) | Full session test — preflight still works? |
| 8 | Replace `CLAUDE.md` (104→52) | MEDIUM (major change) | Full session test — verify ALL behavior |
| 9 | Create `interfaces/desktop/src/lib/design/CLAUDE.md` | LOW (net new child) | Work in ColdLight dir, verify child loads |
| 10 | Add auto-format hook | LOW (net new) | Edit a file, check formatting runs |

**Steps 1-6 can happen in one session.** All additive, no replacements.
**Steps 7-8 are the risky ones.** Do them in a fresh session and test thoroughly.
**Steps 9-10 are polish.** Do after core is stable.

---

## 6. QUESTIONS FOR JESSE BEFORE DEPLOYING

1. **Zod vs ArkType in ColdLight:** Current CLAUDE.md lists Zod. Memory says
   ArkType replaced Zod platform-wide. Is ColdLight's `_base` still on Zod
   or has it migrated? This affects rules/svelte.md.

2. **ColdLight child CLAUDE.md:** OK to move the ~30 lines of ColdLight
   architecture into `interfaces/desktop/src/lib/design/CLAUDE.md`?
   This is the biggest budget recovery.

3. **preflight.md SurrealDB queries:** OK to move curl patterns to a
   `/preflight-db` skill instead of always-loaded rule? This saves ~20
   instruction slots.

4. **Sprint Process:** OK to move to a skill (`/sprint-execute`) instead
   of always-loaded in CLAUDE.md? Only relevant during sprint execution.

5. **psych-translator.js on Windows:** The hook uses `/dev/stdin` for
   JSON parsing. Need to test on Windows/PowerShell. May need
   `process.stdin` approach instead.
