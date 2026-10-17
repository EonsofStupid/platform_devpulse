# CLAUDE.KB CONSOLIDATED REFERENCE

| Field | Value |
|-------|-------|
| **Created** | `2026-03-31` |
| **Full docs** | Download from Claude.ai chat session (8 files, ~3K lines) |
| **This file** | Key data points, tables, and actionable items from all 8 docs |

---

## CONFIRMED ISSUES (14 total, from Claude Code v2.1.88 leak)

| ID | Issue | Severity | Fix type |
|----|-------|----------|----------|
| CC-001 | False completion (29-30% rate) | CRITICAL | Stop hook + CLAUDE.md |
| CC-002 | Context compaction at 167K tokens | CRITICAL | Session discipline + rules |
| CC-003 | Brevity mandate in system prompt | HIGH | CLAUDE.md override |
| CC-004 | 2,000-line file read cap | HIGH | CLAUDE.md rule |
| CC-005 | Tool result truncation (50K→2K) | HIGH | CLAUDE.md rule |
| CC-006 | Silent edit failure on stale context | CRITICAL | CLAUDE.md + hooks |
| CC-007 | grep not AST (text matching only) | HIGH | CLAUDE.md rule |
| CC-008 | Compaction failure → silent disable | MEDIUM | Session discipline |
| CC-009 | Frustration regex → apologetic mode | MEDIUM | PSYCH middleware |
| CC-010 | Anti-distillation fake tools in prompt | LOW | Env var opt-out |
| CC-011 | 14 prompt cache-break vectors | MEDIUM | Session discipline |
| CC-012 | Multi-agent coordinator is prompt-based | MEDIUM | Awareness |
| CC-013 | axios supply chain compromise | URGENT | Binary installer |
| CC-014 | KAIROS daemon (competitive intel) | LOG | Monitor |

## INSTRUCTION BUDGET

| Layer | Budget | Target |
|-------|--------|--------|| System prompt | ~50 slots (fixed) | N/A |
| CLAUDE.md | ~40 instructions | 40-60 lines |
| Rules (all files) | ~40 instructions | <20 lines each |
| Skills (descriptions) | ~15K chars | On-demand |
| Hooks | Unlimited (code) | Deterministic |
| TOTAL | ~150-200 max | Prune ruthlessly |

## ENFORCEMENT HIERARCHY

| Priority | Mechanism | Compliance | Use for |
|----------|-----------|------------|---------|
| 1st | Hooks (command) | 100% | Format, verify, security gates |
| 2nd | settings.json deny | 100% | Block destructive commands |
| 3rd | Rules (path-scoped) | ~80% | Language/domain conventions |
| 4th | CLAUDE.md | ~80% | Structure, commands, hard rules |
| 5th | Skills | On-demand | Domain knowledge when needed |

## EFFORT/THINKING KEYWORDS (Claude Code CLI only)

| Keyword | Budget | Use when |
|---------|--------|----------|
| `think` | ~10K tokens | Routine analysis |
| `think more` / `think deeply` | ~16K tokens | Design decisions |
| `think harder` | ~24K tokens | Complex debugging |
| `ultrathink` | ~31,999 tokens | Architecture, migration, algorithmic |
| `/effort low` | Persistent | Renames, greps, simple questions |
| `/effort medium` | Persistent (DEFAULT) | Daily coding, small refactors |
| `/effort high` | Persistent | Multi-file refactors, reviews |

## SESSION COMMANDS CHEATSHEET

| Command | When |
|---------|------|
| `/clear` | Between tasks. ALWAYS when switching backend↔frontend |
| `/compact focus on X` | At 50% context. Preserve specific things. |
| `/plan` | BEFORE multi-file work. Non-negotiable. |
| `/model sonnet` | Default. Switch to opus only for architecture. |
| `/effort high` | Complex tasks. Low for mechanical. |
| `/memory` | Verify CLAUDE.md and rules loaded |
| `/context` | Check context usage % |

## HOOK PATTERNS (universal, every project)

### Auto-format (PostToolUse)
```json
{"matcher":"Write|Edit","hooks":[{"type":"command",
  "command":"npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""}]}
```
### Verification gate (Stop hook)
```json
{"hooks":[{"type":"command","command":".claude/hooks/verify-on-stop.sh","timeout":60}]}
```
Exit 2 = Claude keeps working until verification passes.

### Security gate (PreToolUse)
```json
{"matcher":"Bash","hooks":[{"type":"command",
  "command":"echo \"$CLAUDE_TOOL_INPUT\" | grep -qE 'rm -rf|--force|DROP TABLE' && exit 2 || exit 0"}]}
```

## HALLUCINATION PREVENTION BY DOMAIN

| Domain | #1 Hallucination | Kill shot |
|--------|-----------------|-----------|
| React/Next.js | Pages Router patterns in App Router | Rule: `App Router ONLY` |
| Next.js | `getServerSideProps` | Rule: Server Components + async |
| Supabase | Invents methods that don't exist | Context7 MCP for current API |
| Prisma | Forgets `prisma generate` after schema edit | Rule: generate after EVERY edit |
| Drizzle | Uses Prisma syntax | Rule: SQL-like builder, not objects |
| Remix | Uses Next.js data fetching | Rule: `loader()` + `useLoaderData()` |
| CSS | Invents Tailwind classes | Tailwind IntelliSense validation |
| Any library | Hallucinates API surface | **Context7: fetch docs before using uncertain API** |

## USER TIERS (Anthropic-sourced)

| Tier | Who | Prompt quality | Verification | DevPulse calibration |
|------|-----|---------------|--------------|---------------------|
| 0 | Non-coder ("vibe coder") | Lowest | Accepts first output | Max TEACHER, max SCRIBE, max GUARDIAN |
| 1 | Beginner coder | Low, wrong terms | Visual check only | High TEACHER, high SCRIBE |
| 2 | Competent dev | Medium, can specify | Runs tests, reviews | Low TEACHER, medium SCRIBE |
| 3 | AI power user | High, COSTAR-level | Multi-layer verify | TEACHER off, GUARDIAN active |

### Key Anthropic numbers:
- 0.92 correlation: prompt quality ↔ output quality (SCRIBE's entire reason to exist)
- -17%: skill formation when delegating code generation (Teaching Without Lecturing validated)
- 0-20%: tasks fully delegatable even by experts (GUARDIAN's job)
- 85.7%: iterate but don't verify (ENFORCER's job)

## 10 BUILDABLE TOOLS (sorted by priority)

| # | Tool | Effort | Resolves |
|---|------|--------|----------|
| 1 | verify-gate | 1D | CC-001 (30% false claims) |
| 2 | psych-hook | 1D | CC-009 (frustration → apologetic mode) |
| 3 | learn-loop | 1D | -17% skill formation gap |
| 4 | hook-gen | 2D | G-006/007/012/014 (missing hooks) |
| 5 | phase-plan | 1D | CC-002 (context compaction) |
| 6 | claude-audit | 2D | G-011 (bloated CLAUDE.md) |
| 7 | rename-guard | 2D | CC-007 (grep not AST) |
| 8 | dead-sweep | 2D | CC-002 Step 0 (dead code) |
| 9 | sec-scan | 3D | G-018 (10 structural vuln patterns) |
| 10 | context-pulse | 2D | CC-002/008 (session health) |

## PRODUCT INSIGHT: EMOTIONAL TRANSLATION LAYER

**Nobody else is building this.**

Every product either punishes frustration (Claude Code's apologetic mode)
or ignores it (everyone else). DevPulse intercepts → extracts technical need
→ amplifies precision. User vents freely. Model stays sharp.

Pipeline: User → PSYCH (emotional extraction) → SCRIBE (technical translation)
→ ENFORCER (validation) → outbound prompt (clean, no frustration triggers)

**One-liner:** "Every other product tells users to stop being human.
DevPulse translates being human into better results."
