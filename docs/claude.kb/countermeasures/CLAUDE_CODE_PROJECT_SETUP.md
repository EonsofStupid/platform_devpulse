# Claude Code Project Setup — What The Smart People Actually Do

| Field | Value |
|-------|-------|
| **Status** | `ACTIVE` |
| **Version** | `1.0.0` |
| **Created** | `2026-04-20` |
| **Source** | Synthesized from Apr 2026 Claude Code leak analysis + community practice |
| **Purpose** | Methodical project setup that neutralizes CC-001 through CC-014 |
| **Companion** | `CLAUDE_CODE_COUNTERMEASURES.md` (in same folder) |

---

## The Core Mental Model

Claude Code has a finite attention budget. This is not a metaphor.

- System prompt consumes ~50 instruction slots (fixed, yours to work around)
- `CLAUDE.md` + all `.claude/rules/*.md` + all skill descriptions share the remaining ~100-150
- Past ~200 total instructions, compliance drops — rules at the bottom get ignored randomly
- Claude Code wraps your `CLAUDE.md` in: `<system-reminder>IMPORTANT: this context may or may not be relevant</system-reminder>` — meaning it **can decide to ignore it**

**Implication:** every line in `CLAUDE.md` must earn its place. If removing a line wouldn't cause Claude to make a mistake, delete it. Bloat is the #1 reason rules get ignored.

---

## The Three Enforcement Tiers

| Tier | Mechanism | Reliability | Use for |
|------|-----------|-------------|---------|
| **Advisory** | `CLAUDE.md`, rules files | ~80% compliance | Style, preferences, conventions, guidance |
| **Deterministic** | `settings.json` hooks (command type) | 100% guaranteed | Formatting, security gates, verification |
| **Semantic** | Hooks (prompt / agent type) | ~90% compliance | "Does this match intent?", quality judgment |

**The critical insight:** anything that MUST happen every time without exception belongs in **hooks**, not `CLAUDE.md`. `CLAUDE.md` is for guidance Claude should consider. Hooks are for behavior you require.

### Deterministic > Advisory — The Mapping

| Want this? | DON'T put in CLAUDE.md | DO put in settings.json |
|-----------|------------------------|------------------------|
| No Co-Authored-By | "NEVER add attribution" | `"attribution": {"commit": ""}` |
| Block force push | "NEVER force push" | `"deny": ["Bash(git push --force:*)"]` |
| Auto-format | "Always format code" | `PostToolUse` hook with prettier/rustfmt |
| Run tests on done | "Run tests after changes" | `Stop` hook with test suite |
| Block `rm -rf` | "Never delete directories" | `PreToolUse` hook with exit 2 |
| Lint before done | "Lint after writing" | `Stop` hook |

If you wrote the rule in CLAUDE.md, it's guidance. If you wrote the hook, it's law.

---

## The File Layout Smart Teams Ship

```
<project-root>/
├── CLAUDE.md                           ← 40-60 lines MAX. Structure, commands, hard rules.
├── .claude/
│   ├── settings.json                   ← Permissions + hooks. The real enforcement layer.
│   ├── rules/
│   │   ├── claude-code-countermeasures.md   ← The CC-001..CC-014 overrides (see companion doc)
│   │   ├── rust.md                     ← Path-scoped: src/**/*.rs
│   │   ├── frontend.md                 ← Path-scoped: ui/**/*.svelte
│   │   └── ...one file per domain, <20 lines each
│   ├── skills/
│   │   ├── review/SKILL.md             ← /review workflow
│   │   ├── debug/SKILL.md              ← /debug workflow
│   │   └── ...on-demand, not always loaded
│   └── hooks/
│       ├── verify-on-stop.sh           ← Runs cargo check / svelte-check before "done"
│       ├── format-on-write.sh          ← PostToolUse formatter
│       └── block-dangerous.sh          ← PreToolUse gate
└── docs/
    └── ...real docs, linked from CLAUDE.md via @imports
```

### Budget allocation (recommended)

| Layer | Budget | What goes here |
|-------|--------|----------------|
| `CLAUDE.md` | 40-60 lines | Project structure, build/test commands, stack, top 5 hard rules |
| Rules (all files combined) | 40-60 lines total | Path-scoped enforcement, language-specific |
| Skills (descriptions only) | ~15K chars total | On-demand domain knowledge triggers |
| Hooks | Unlimited (code, not tokens) | The real power — deterministic enforcement |

---

## The Methodical Setup Sequence

Do these in order. Each step neutralizes specific CC-### issues from the companion doc.

### Step 1 — Supply chain sanity check (CC-013)

Before anything else, verify your machine isn't compromised:

```bash
# In every project with a lockfile
grep -r "plain-crypto-js" package-lock.json pnpm-lock.yaml yarn.lock 2>/dev/null
# If found: rotate ALL secrets, machine was compromised
```

Use the **standalone binary installer** for Claude Code, not npm. Pin `axios` to `1.14.0` in any project that imports it.

### Step 2 — Skeleton `CLAUDE.md` (40-60 lines)

Write the minimal version first. Resist the urge to document everything.

Required sections:
1. **Project one-liner** — what this codebase is, in one sentence
2. **Stack** — languages, frameworks, key libraries (bullets, no prose)
3. **Commands** — `build`, `test`, `lint`, `dev` (the literal commands, not descriptions)
4. **Structure** — top-level folder tree, one line per folder
5. **Top 5 hard rules** — the most critical invariants (each under two lines)
6. **@imports** — link to deeper docs, don't inline them

Everything else is bloat until you watch Claude make a specific mistake that needs it.

### Step 3 — `settings.json` with the Stop hook (CC-001, THE single most impactful setup)

This one hook gives you the biggest quality jump of any Claude Code configuration. It's the employee-grade verification gate that external users don't get by default.

```json
{
  "attribution": {
    "commit": ""
  },
  "permissions": {
    "deny": [
      "Bash(git push --force:*)",
      "Bash(rm -rf /:*)",
      "Bash(rm -rf ~:*)"
    ]
  },
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/verify-on-stop.sh",
        "timeout": 60
      }]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format-on-write.sh"
      }]
    }]
  }
}
```

And the verify hook itself (`.claude/hooks/verify-on-stop.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail

# Adjust to your stack. Exit 2 tells Claude to keep working.
if [ -f Cargo.toml ]; then
  cargo check --workspace 2>&1 || exit 2
fi
if [ -f package.json ]; then
  pnpm check 2>&1 || npx tsc --noEmit 2>&1 || exit 2
fi

exit 0
```

`chmod +x` it. This alone closes CC-001. A single file, well under a hundred lines, recovers the ~30% false-completion rate.

### Step 4 — Path-scoped rule files (CC-002, CC-004, CC-005, CC-006, CC-007)

`CLAUDE.md` is global. Rules files activate only when Claude is working on matching paths. This keeps the always-loaded instruction budget small.

Example — `.claude/rules/rust.md`:

```markdown
---
paths:
  - "src/**/*.rs"
  - "crates/**/*.rs"
---

# Rust Rules

- Run `cargo clippy -p <crate>` before considering any Rust task complete
- Handle errors with `thiserror` (lib) / `anyhow` (app) — NEVER `unwrap()` in production
- Prefer `&str` over `String` in function parameters
- For files > 500 LOC: read in chunks with offset/limit (CC-004)
- On rename: search direct calls, string literals, re-exports SEPARATELY (CC-007)
```

**One file per domain. Under 20 lines each.** Don't put everything in `CLAUDE.md`.

Copy the `claude-code-countermeasures.md` from the companion doc as your first rule file. It neutralizes CC-001 through CC-009 in a single path-unscoped rule.

### Step 5 — Skills, not MCPs (security + auditability)

Skills are transparent markdown you can read and audit. MCP servers are black boxes that consume tool-definition tokens before Claude reads a single line of your code.

**Prefer skills when:**
- The behavior can be expressed as a workflow, not a service integration
- You want a reviewable, diffable, versionable definition
- You're building a `/review`, `/debug`, `/plan`, `/onboard` style command

**Keep MCPs only when:**
- You genuinely need a stateful service (GitHub, issue tracker, deployment platform)
- The MCP is from a trusted vendor
- You're using it weekly

**The MCP overload trap:** installing 15-20 MCPs "just in case" loads 100+ tool definitions into context before any work begins. Most projects need 3-5 MCPs maximum. Audit quarterly.

### Step 6 — The self-improving loop

When Claude makes a mistake:

1. Tell it: *"Update the appropriate rule file so this doesn't happen again."*
2. Claude writes its own rule.
3. Next session, it follows the rule it wrote.

Over time, `CLAUDE.md` and the rules files become shaped by **real mistakes**, not hypothetical rules. This is the most valuable long-term investment in any Claude Code project — more valuable than any single rule you write today.

Advanced version: a `/learn-mistake` skill that logs the error pattern, searches for similar past errors, appends to a mistakes file that `CLAUDE.md` `@imports`. Formal self-improving loop.

---

## The Session Discipline Smart People Practice

CC-002 (167K compaction cliff), CC-008 (silent compaction disable), and CC-011 (14 cache-break vectors) are not fixable at the config layer. They require habits.

### The habits that actually work

1. **Manual `/compact` at 50% capacity.** Don't wait for the auto-compaction cliff. At ~80K tokens in, run `/compact focus on [what matters right now]` and preserve intent instead of letting the system pick.

2. **`/clear` between distinct tasks.** A fresh context window is the single best quality lever. Long sessions accumulate drift.

3. **One major task per session.** Not a marathon. Not a debugging saga. One task, executed, then a fresh session for the next.

4. **Set configuration BEFORE starting work.** Toggling thinking mode, model, or permissions mid-session breaks the prompt cache (CC-011). Decide upfront, commit, work.

5. **`/plan` before multi-file work.** Planning mode surfaces the structural questions before you're knee-deep in edits. Five minutes of planning saves fifty minutes of compaction recovery.

6. **Phase your refactors.** Max 5 files per phase (CC-002 keeps 5 files intact across compaction). State the phase plan upfront. Wait for approval between phases.

7. **Step 0 of any refactor: dead code cleanup.** Reduces surface area before Claude's context fills.

8. **Re-read files before editing after 10+ messages.** Trust nothing from memory. Stale context + silent Edit failure (CC-006) is the most insidious failure mode.

9. **If quality degrades mid-session, start fresh.** Don't try to recover. CC-008 may have silently disabled compaction. You're in a degraded state with no warning.

10. **Keep `CLAUDE.md` stable between sessions.** Frequent edits break cache (CC-011).

---

## What NOT To Do (the common mistakes)

These are the failure patterns the serious practitioners have stopped doing. Copying them costs you the quality gains the countermeasures provide.

| Mistake | Why it hurts | What smart people do instead |
|---|---|---|
| Putting mechanical rules in `CLAUDE.md` ("NEVER add Co-Authored-By") | ~80% compliance. 20% causes CI failures. | Move to `settings.json` as deterministic config |
| Writing a 500-line `CLAUDE.md` with every rule | Past ~200 instructions, bottom rules get ignored randomly | 40-60 line `CLAUDE.md`, rest in path-scoped rule files |
| Installing every MCP server "just in case" | 100+ tool definitions consuming tokens before work begins | 3-5 MCPs max, audit quarterly, prefer skills |
| Skipping the Stop hook | CC-001 goes unchecked; ~30% false completion rate | One `verify-on-stop.sh` is the single biggest win |
| Manual "fix it yourself" loops instead of updating rules | Same mistake in every session | "Update the rule so this doesn't happen again" |
| Marathon debugging sessions | Compaction cliff + silent disable + cache breaks stack up | One task per session, fresh context between |
| Partial framework migrations left in the tree | Claude picks wrong pattern when old + new coexist | Finish migrations before starting new work |
| Trusting coordinator / sub-agent output without verification | CC-012: coordinator is a prompt, not code | Treat all sub-agent output as DRAFT, verify |
| Ignoring frustration-trigger behavior shift (CC-009) | Apologetic mode when precision matters most | State problem technically, not emotionally |
| Editing `CLAUDE.md` between every session | Breaks prompt cache, spikes cost/latency | Let it stabilize; edit only when a real mistake demands it |

---

## Tier 3 Operator Calibration (DevPulse-specific)

If you're Jesse running DevPulse with Clyffy's Council active, most of the defensive scaffolding above is already internalized. The Council handles what `.claude/rules/` handles for other users:

- **TEACHER**: off unless requested. You don't need terminology explained.
- **PSYCH**: off unless detected. Frustration routed around, not triggered.
- **SCRIBE (Fox)**: light touch. Your prompts are already high-context.
- **GUARDIAN**: active — even Tier 3 operators miss CC-007 (grep not AST) renames.

**The short version for DevPulse:** keep the Stop hook. Keep session discipline. Skip the heavy `.claude/rules/` tree inside DevPulse's own repo because Clyffy's Council covers it. When working on OTHER projects, use the full tree above.

---

## Implementation Order (If Starting From Zero)

Do this exact sequence. Two hours, one evening, done.

1. Run the `plain-crypto-js` grep across every project lockfile (5 min)
2. Write the 40-60 line `CLAUDE.md` skeleton (20 min)
3. Drop `settings.json` with the Stop hook + `verify-on-stop.sh` (20 min)
4. Copy `.claude/rules/claude-code-countermeasures.md` from the companion doc (5 min)
5. Add one language-specific rule file for your primary stack (10 min)
6. Test: ask Claude to introduce a syntax error. Watch the Stop hook catch it. (10 min)
7. Commit it all. Let it sit stable for a week before touching.
8. After a week of use, add rules ONLY for mistakes you actually watched Claude make.

The self-improving loop from Step 6 of the methodical sequence takes over from there.

---

## Companion Document

- **`CLAUDE_CODE_COUNTERMEASURES.md`** — the verbatim CC-001 through CC-014 catalog this setup neutralizes.

*End of setup guide. Update this doc only when Claude Code ships a new version that changes observed behavior.*
