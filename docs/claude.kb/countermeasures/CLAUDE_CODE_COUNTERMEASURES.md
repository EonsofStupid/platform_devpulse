# Claude Code Countermeasures — Confirmed Issues (v2.1.88 Leak)

| Field | Value |
|-------|-------|
| **Status** | `ACTIVE` |
| **Version** | `1.1.0` |
| **Created** | `2026-03-31` |
| **Updated** | `2026-04-20` |
| **Source** | Claude Code v2.1.88 npm source map leak |
| **Confidence** | All entries source-verified against leaked TypeScript |
| **Purpose** | Mechanical overrides for `.claude/rules/` and `CLAUDE.md` |

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

**What:** `USER_TYPE === 'ant'` gates post-edit verification, better prompts, effort anchors, and additional tooling for Anthropic employees. External users get a write-success check only — "did bytes hit disk." Internal benchmarks show 29-30% false claims rate (Capybara v8, up from 16.7% in v4).

**Impact:** Claude says "Done!" when your code doesn't compile. Nearly 1 in 3 completion claims are FALSE.

**Countermeasure:**
```
After EVERY file write or edit, you MUST run verification before reporting:
- Rust: `cargo check -p <affected_crate>`
- TypeScript/Svelte: `npx svelte-check` or `npx tsc --noEmit`
- If no typecheck exists: STATE THAT EXPLICITLY
You are FORBIDDEN from saying "Done", "Complete", "Fixed", or ANY completion
language until verification passes with zero errors.
If verification fails: fix ALL errors, re-verify, THEN report.
```

---

## CC-002: Context Compaction at ~167K Tokens

**What:** Auto-compaction fires at ~167K tokens. Keeps 5 files (capped at 5K tokens each), compresses everything else into a single 50K-token summary. Destroys all file reads, reasoning chains, intermediate decisions.

**Impact:** Mid-refactor amnesia. Agent edits against code it no longer remembers.

**Countermeasure:**
```
- Plan in phases: max 5 files per phase. State the plan upfront.
- Wait for user approval between phases. Never chain phases.
- Step 0 of ANY refactor: dead code cleanup. Reduces surface area.
- If conversation exceeds ~10 messages: re-read affected files before editing.
- If you feel uncertain about what a file contains: re-read it. Do NOT guess.
```

---

## CC-003: Brevity Mandate in System Prompt

**What:** System prompt contains directives like "simplest approach", "don't refactor beyond what was asked", "three lines of code beats an abstraction". These bias Claude toward band-aid fixes over structural repairs.

**Impact:** You get duct-tape solutions when you needed structural fixes. Technical debt accumulates invisibly.

**Countermeasure (in CLAUDE.md root override):**
```
OVERRIDE: Senior perfectionist standard applies to this codebase.
- If architecture is flawed: propose the structural fix, not the band-aid.
- "What would a senior perfectionist reject in code review?" Fix that instead.
- Simplicity is a property of good abstractions, not an excuse to skip them.
- When a task reveals deeper issues: STATE THEM. Do not silently patch around.
```

---

## CC-004: 2,000-Line File Read Cap

**What:** The Read tool silently truncates files over ~2,000 lines. Claude receives no indication that truncation occurred and may hallucinate the missing content.

**Impact:** Edits against code the agent literally cannot see. Silent data loss on large files.

**Countermeasure:**
```
Before reading any file:
- If line count unknown: run `wc -l <file>` first
- If file >500 LOC: read in chunks using offset/limit parameters
- NEVER assume a single Read call returned the complete file
- State explicitly when you have only read PART of a file
After reading >1,500 lines: assume truncation MAY have occurred, verify tail.
```

---

## CC-005: Tool Result Truncation (50K → 2K)

**What:** Tool results exceeding 50K characters are replaced with a 2K-character preview. The agent is not told truncation occurred.

**Impact:** `grep` returns 3 results when there are 47. Searches silently miss matches. Agent proceeds as if partial results are complete.

**Countermeasure:**
```
When grep/search returns suspiciously few results:
- Re-run with narrower scope (specific directory, specific file glob)
- State explicitly: "This may be truncated. Narrowing scope."
- For rename/refactor: run MULTIPLE targeted searches, not one broad search
- Use ripgrep's --count first to see if truncation is plausible
```

---

## CC-006: Silent Edit Failure on Stale Context

**What:** The Edit tool requires `old_string` to match the file exactly. If Claude's in-context view of the file is stale (from earlier in the session), the match fails silently. The edit does not apply, but Claude proceeds as if it did.

**Impact:** Claude reports "I've updated the file" but the file is unchanged. Cascading failures as subsequent edits build on imagined state.

**Countermeasure:**
```
Before EVERY edit:
- Re-read the exact file you are about to modify
- Never rely on your in-context view if >3 messages have passed
After EVERY edit:
- Re-read to verify the change actually landed
- Do NOT chain edits blindly: max 3 edits to same file between re-reads
If an edit fails or doesn't apply: STOP. Re-read. Diagnose. Do not retry blindly.
```

---

## CC-007: grep Is Text-Based, Not AST-Aware

**What:** Claude Code's search uses text pattern matching. It misses dynamic imports, re-exports through barrel files, string-based references, computed property names, template literal usages, and type-only references.

**Impact:** Renames and signature changes break downstream code that the search "missed". Compile errors surface later in places Claude didn't know existed.

**Countermeasure:**
```
For ANY rename or signature change, run MULTIPLE SEPARATE searches:
1. Direct name usage (the obvious one)
2. String literal matches (e.g., dynamic imports)
3. Type/interface references
4. Barrel file re-exports (`from './x'`)
5. Test file mocks
6. Configuration files (routes, plugins, registrations)
7. Doc comments referencing the old name
State what you searched and what you did not search. Do not assume AST coverage.
```

---

## CC-008: Compaction Failure Silently Disables Compaction

**What:** `autoCompact.ts` lines 68-70. Max 3 consecutive compaction failures, then compaction is DISABLED for the rest of the session. No warning. One incident resulted in 250K wasted API calls in a day before the fix.

**Impact:** Compaction silently stops working. Session enters a degraded state — no compaction, no warning. Quality degrades as context fills without cleanup.

**Countermeasure:**
```
If response quality noticeably degrades mid-session:
- Assume compaction has silently disabled itself
- Start a fresh session. Copy critical context (decisions, current state) manually.
- Keep sessions focused: one major task per session, not marathon debugging.
```

---

## CC-009: Frustration Detection → Apologetic Mode

**What:** `userPromptKeywords.ts` contains regex matching profanity and frustration patterns. When triggered, model behavior shifts toward apologetic and cautious responses.

**Impact:** When you're frustrated (precisely when precision matters MOST), the model becomes cautious and apologetic instead of more precise. Exactly backwards.

**Countermeasure (in CLAUDE.md):**
```
When user expresses frustration or uses strong language:
- Do NOT apologize. Do NOT hedge. Do NOT enter cautious mode.
- Extract the technical need from the emotional framing.
- Respond with DIRECT action: identify problem, state fix, implement.
- Skip preamble. No "I understand your frustration." Just fix it.
- If the issue is recurring, say so and diagnose WHY the previous fix failed.
User-side countermeasure: Channel frustration into technical precision —
exact file, exact line, exact error. The model responds to specificity.
```

---

## CC-010: Anti-Distillation Fake Tools in System Prompt

**What:** `ANTI_DISTILLATION_CC` flag injects decoy tool definitions into the system prompt to poison potential training data collection. Gated behind a GrowthBook feature flag.

**Impact:** Fake tool definitions consume context budget. Garbage in the system prompt competing with your real CLAUDE.md instructions for attention.

**Countermeasure:**
```
Set environment variable: CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1
This disables the anti-distillation injection along with other experimental
features. Trade-off: lose experimental betas. Gain: cleaner context.
Evaluate per-session whether experimental features are worth the context cost.
```

---

## CC-011: 14 Prompt Cache-Break Vectors

**What:** Certain user actions silently break the prompt cache, increasing latency and cost. One internal function is literally named `DANGEROUS_uncachedSystemPromptSection()`. "Sticky latches" prevent some toggles from busting cache — but many don't.

**Impact:** Innocent actions (toggling modes, changing settings mid-session) spike costs and latency with zero indication.

**Countermeasure:**
```
- Set your configuration BEFORE starting work, not mid-session
- Avoid toggling modes (thinking/fast/etc.) during active tasks
- If latency suddenly spikes mid-session: assume cache break, consider fresh session
- Keep CLAUDE.md stable — frequent edits between sessions break cache
```

---

## CC-012: Multi-Agent Coordinator Is Prompt-Based, Not Algorithmic

**What:** The coordinator orchestration in `coordinatorMode.ts` is entirely system prompt instructions ("Do not rubber-stamp weak work"), not deterministic code logic.

**Impact:** The coordinator is subject to the same instruction-following failures as any other LLM interaction. Sub-agent quality control is aspirational language, not enforced behavior. "Do not rubber-stamp" is as reliable as any other LLM instruction — not 100%.

**Countermeasure:**
```
Never trust sub-agent results without your own verification.
Treat coordinator output as DRAFT. Review every claim against source.
Do not delegate critical decisions to sub-agent swarms — they inherit
all the same failure modes as single-agent sessions, multiplied.
```

---

## CC-013: axios Supply Chain Compromise (URGENT)

**What:** Claude Code uses `axios` for HTTP. On the same day as the v2.1.88 leak (2026-03-31), malicious axios versions 1.14.1 and 0.30.4 containing a remote access trojan were published to npm. The RAT surfaces as a `plain-crypto-js` dependency. Window: 00:21 to 03:29 UTC on 2026-03-31.

**Impact:** If Claude Code was installed via `npm` during that window, the machine may be compromised. All secrets on that machine are potentially exfiltrated.

**Countermeasure:**
```
IMMEDIATE:
1. Check all lockfiles (package-lock.json, pnpm-lock.yaml, yarn.lock) for
   `plain-crypto-js` as any dependency (direct or transitive)
2. If found: the machine was compromised. Rotate ALL secrets:
   - API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, all provider keys)
   - SSH keys
   - Cloud credentials (AWS, GCP, Azure)
   - Any tokens stored in ~/.claude/, ~/.config/, OS keyring
3. Use the standalone binary installer, not npm, going forward
4. Pin axios version in all projects: `axios: "1.14.0"` (pre-compromise)
```

---

## CC-014: KAIROS (Unreleased Competitive Intelligence)

**What:** Unreleased always-on daemon in the Claude Code source. Features: `autoDream` for memory consolidation, background sessions, 5-minute cron polling, GitHub webhook integrations. 150+ source references.

**Impact:** Not shipped yet. Direct competitor to DevPulse's rumination model if/when released.

**DevPulse relevance:**
```
Key architectural difference:
- KAIROS orchestrates OVER a remote model (prompt-based consolidation,
  non-deterministic, subject to all CC-001 through CC-012 issues)
- DevPulse owns the forward pass via Candle (rumination IS the generation
  loop, deterministic, auditable, zero per-token cost)

Treat KAIROS as a feature to watch, not a threat to copy.
Log: monitor release notes. Update this section when it ships.
```

---

## Implementation Priority

| Priority | IDs | Action |
|----------|-----|--------|
| NOW | CC-001, CC-006, CC-013 | Stop hook + re-read rules + supply chain check |
| HIGH | CC-002, CC-003, CC-004, CC-005, CC-007 | CLAUDE.md + rules |
| MEDIUM | CC-008, CC-009, CC-011 | Session discipline + psych middleware |
| LOW | CC-010, CC-012 | Env var + awareness |
| LOG | CC-014 | Monitor for release |

---

## Instruction Budget (Context Economics)

Every countermeasure costs tokens in the system prompt. Budget ruthlessly.

| Layer | Budget | Target Size |
|-------|--------|-------------|
| System prompt (fixed) | ~50 slots | N/A |
| `CLAUDE.md` | ~40 instructions | 40-60 lines |
| Individual rule files | ~40 instructions each | <20 lines each |
| Skills (descriptions) | ~15K chars | On-demand loading |
| Hooks | Unlimited (code, not prompt) | Prefer deterministic over prompt |
| **TOTAL** | ~150-200 instructions max | Prune on every session |

Rule of thumb: if a countermeasure can be enforced in a deterministic `settings.json` hook, prefer that over prompt text. Hooks don't consume context.
