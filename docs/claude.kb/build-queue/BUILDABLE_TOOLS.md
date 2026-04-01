# BUILDABLE TOOLS — 10 Tools, 4 Weeks

| Status | `BUILD QUEUE` | Created | `2026-03-31` |
|--------|-------------|---------|-------------|

## Strategy: Simple (open source, AngryViber) → Smart (DevPulse moat)

---

## WEEK 1: Maximum Impact (5 days)

### Tool 1: verify-gate (1D) — CC-001 fix
Stop hook. Auto-detects Rust/TS/Svelte/Python. Runs typecheck. Exit 2 = Claude keeps working.
Resolves: 29-30% false claims. "The employee verification gate, democratized."
Distribution: Single bash script. Drop into any .claude/hooks/.

### Tool 2: psych-hook (1D) — CC-009 fix
UserPromptSubmit hook. Detects frustration regex, strips profanity, injects urgency + technical framing.
Model never enters apologetic mode. User vents freely.
Distribution: Single JS file. Blog: "Stop apologizing and fix my code."

### Tool 3: learn-loop (1D) — skill formation fix
/learn-mistake skill. Logs error → .claude/mistakes.md → CLAUDE.md @imports.
Deduplicates. Counts frequency. At 3 occurrences → promote to rule.
Distribution: Single SKILL.md. Self-improving loop formalized.

### Tool 4: hook-gen (2D) — scaffold all hooks
/hook-gen skill. Scans project, detects stack, generates all 4 critical hooks.
Merges into settings.json. "5-minute setup for every project."
Distribution: Skill file + blog: "The 4 hooks every project needs."

## WEEK 2: Depth (5 days)

### Tool 5: phase-plan (1D) — CC-002 fix
/phase-plan skill. Generates phased plan, max 5 files/phase, verification gates.
Runs on Opus in forked context. Plan comes back as clean checklist.

### Tool 6: claude-audit (2D) — budget analysis
Node CLI. Reads .claude/ dir. Reports instruction budget usage, bloat detection,
mechanical-rules-in-wrong-place, MCP audit. `npx claude-audit`.

### Tool 7: rename-guard (2D) — CC-007 fix
PreToolUse hook. Detects rename operations. Forces 7-category multi-pass search
before allowing the edit. Exit 2 blocks until search complete.

## WEEK 3: Security (5 days)

### Tool 8: dead-sweep (2D) — CC-002 Step 0
/dead-sweep skill. Removes dead imports, unused exports, debug logs.
Commits cleanup separately. ALWAYS runs before refactors.

### Tool 9: sec-scan (3D) — 10 structural vuln patterns
Skill + hook. Checks DryRun Security's 10 patterns: broken access control,
unauthenticated endpoints, business logic flaws, OAuth failures, missing
rate limiting, IDOR, missing validation, JWT issues, 2FA bypass, client-only validation.

## WEEK 4: Polish + Distribution (5 days)

### Tool 10: context-pulse (2D) — session health
SessionStart inject + PostToolUse tracking + /context-health skill.
Warns at 30+ tool calls. Tracks correction spirals.

### Packaging (3D)
Bundle all 10 as `angryviber/claude-survival-kit` on GitHub.

---

## DISTRIBUTION: angryviber/claude-survival-kit

```
hooks/verify-on-stop.sh, psych-translator.js, sec-quick-check.sh, rename-guard.js
skills/learn-mistake/, dead-sweep/, phase-plan/, security-check/, hook-gen/
claude-audit/index.js + package.json
templates/settings.json + CLAUDE.md
```

Blog posts (AngryViber.com):
1. "Claude Code has a 30% lie rate. Here's the 50-line fix."
2. "Stop apologizing and fix my code."
3. "Your CLAUDE.md is too long and that's why Claude ignores you."
4. "AI code has a 100% security vulnerability rate."
5. "The self-improving AI: mistakes that make Claude smarter."

---

## SIMPLE → SMART UPGRADE PATH (The Funnel)

| Simple (free) | Smart (DevPulse) |
|---------------|------------------|
| Bash verify script | ENFORCER: per-crate targeting + ROTI tracking |
| Regex frustration hook | PSYCH: DIARY cross-ref + tier calibration |
| Grep security patterns | GUARDIAN: tree-sitter AST analysis |
| Manual /learn-mistake | DIARY: auto-captures from ENFORCER rejections |
| Skill-based phase planning | MAESTRO: auto-generates + ENFORCER blocks without plan |
| CLI budget auditor | GUARDIAN: continuous monitoring + UI dashboard |

**Pitch:** "You've been using our free tools. Want them to talk to each other,
remember your project, and get smarter over time? That's DevPulse."
