# Claude Code Countermeasures — Confirmed Issues (v2.1.88 Leak, 2026-03-31)

| Field | Value |
|-------|-------|
| **Status** | `ACTIVE` |
| **Version** | `1.0.0` |
| **Created** | `2026-03-31` |
| **Source** | Claude Code v2.1.88 npm source map leak |
| **Confidence** | All entries source-verified against leaked TypeScript |
| **Purpose** | Mechanical overrides for .claude/rules/ and CLAUDE.md |

---

## How To Use This Document

This is the SSOT for Claude Code's confirmed architectural limitations and the
countermeasures that neutralize them. It feeds:

1. `.claude/rules/claude-code-countermeasures.md` — enforceable rules
2. `CLAUDE.md` root directives — override section
3. `.claude/settings.json` hooks — deterministic verification gates
4. Future: ENFORCER/GUARDIAN ingestion for DevPulse runtime

Every countermeasure below is a MECHANICAL OVERRIDE — not a suggestion.

---

## CC-001: Employee-Only Verification Gate

**What:** `USER_TYPE === 'ant'` gates post-edit verification, better prompts,
effort anchors, and additional tooling for Anthropic employees. External users
get a write-success check only — "did bytes hit disk." Internal benchmarks
show 29-30% false claims rate (Capybara v8, up from 16.7% in v4).

**Impact:** Claude says "Done!" when your code doesn't compile. Nearly 1 in 3
completion claims are FALSE.

**Countermeasure:** After EVERY file write or edit, run verification. Rust: `cargo check -p <crate>`. TypeScript: `npx tsc --noEmit`. FORBIDDEN from completion language until verification passes zero errors.

---

## CC-002: Context Compaction at ~167K Tokens

**What:** Auto-compaction fires at ~167K tokens. Keeps 5 files (5K each), compresses everything else into 50K summary. Destroys all file reads, reasoning chains, decisions.

**Impact:** Mid-refactor amnesia. Edits against code it no longer remembers.

**Countermeasure:** Max 5 files per phase. Dead code cleanup as Step 0. After 10+ messages: re-read before editing. State phase plan, wait for approval.

---

## CC-003: Brevity Mandate

**What:** System prompt says "simplest approach first", "don't refactor beyond asked." System prompt wins unless overridden.

**Impact:** Band-aid fixes. Architectural rot.

**Countermeasure:** Override: "What would a senior perfectionist reject in code review?" Fix that.

---

## CC-004: 2,000-Line File Read Truncation

**What:** Each file read capped at 2,000 lines / 25K tokens. Silently truncated. Agent hallucinates the remainder. Anthropic's own `print.ts` (5,594 lines) can't be read by their own tool.

**Countermeasure:** Files over 500 LOC: MUST read in chunks with offset/limit. NEVER assume single read = complete.

---

## CC-005: Tool Result Silent Truncation (50K → 2K)

**What:** Tool results >50K chars persisted to disk, replaced with 2K preview. Agent doesn't know.

**Countermeasure:** Suspiciously few results: re-run narrower. State truncation suspicion.

---

## CC-006: Silent Edit Failure

**What:** Edit tool fails silently when old_string doesn't match stale context. Agent believes edit applied.

**Countermeasure:** Re-read before EVERY edit. Read again after to confirm. Max 3 edits without verification read.

---

## CC-007: grep Not AST

**What:** Text matching only. Misses dynamic imports, re-exports, string refs, barrel files, test mocks.

**Countermeasure:** On ANY rename: search separately for direct calls, type refs, string literals, dynamic imports, re-exports, barrel files, test mocks.

---

## CC-008: Compaction Failure → Silent Disable

**What:** After 3 consecutive compaction failures, compaction DISABLED for rest of session. No warning. 250K wasted API calls/day before fix.

**Countermeasure:** If quality degrades mid-session: start fresh. One major task per session.

---

## CC-009: Frustration Detection → Apologetic Mode

**What:** `userPromptKeywords.ts` regex matches profanity. Model shifts to cautious/apologetic. LESS precise when precision matters most.

**Countermeasure:** PSYCH middleware intercepts before model sees triggers. Partial fix in CLAUDE.md: "Do NOT apologize. Extract technical need. Direct action."

---

## CC-010: Anti-Distillation Fake Tools

**What:** `ANTI_DISTILLATION_CC` injects decoy tool definitions into system prompt, consuming context budget.

**Countermeasure:** `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1` env var.

---

## CC-011: 14 Prompt Cache-Break Vectors

**What:** Mode toggles mid-session break prompt cache. Spike cost/latency.

**Countermeasure:** Set config BEFORE work. Avoid toggling modes during tasks.

---

## CC-012: Multi-Agent Coordinator is Prompt-Based

**What:** `coordinatorMode.ts` orchestration is system prompt instructions, not code. Subject to same instruction-following failures as everything else.

**Countermeasure:** Never trust sub-agent results without own verification. Treat coordinator output as DRAFT.

---

## CC-013: Supply Chain Risk (axios Compromise)

**What:** Malicious axios 1.14.1 / 0.30.4 with RAT published 2026-03-31. Claude Code uses axios.

**Countermeasure:** IMMEDIATE: check lockfiles for `plain-crypto-js`. If found: machine compromised, rotate all secrets. Use standalone binary installer, not npm. Pin versions.

---

## CC-014: KAIROS (Competitive Intelligence)

**What:** Unreleased always-on daemon. autoDream for memory consolidation. Background sessions. 5-min cron. GitHub webhooks. 150+ references in source.

**DevPulse relevance:** Direct competitor to DevPulse rumination. Key difference: KAIROS orchestrates over remote model (prompt-based consolidation). DevPulse owns forward pass via Candle (rumination IS the generation loop, deterministic, auditable).

---

## Implementation Priority

| Priority | IDs | Action |
|----------|-----|--------|
| NOW | CC-001, CC-006, CC-013 | Stop hook + re-read rules + supply chain check |
| HIGH | CC-002, CC-003, CC-004, CC-005, CC-007 | CLAUDE.md + rules |
| MEDIUM | CC-008, CC-009, CC-011 | Session discipline + psych hook |
| LOW | CC-010, CC-012 | Env var + awareness |
| LOG | CC-014 | Monitor for release |
