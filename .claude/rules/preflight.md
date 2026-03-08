# MANDATORY PREFLIGHT — Execute Before ANY Work

## HARD STOP: You do NOT touch code, propose plans, or make changes until this checklist passes.

This is not optional. This is not a suggestion. Every AI agent (Claude, Cursor, Copilot, Gemini) MUST complete this before doing anything.

---

## Phase 0: Orient (READ ONLY — no code, no proposals)

### 0.1 Load Context from SurrealDB
```bash
# Check if SurrealDB is running
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace global --database knowledge --hide-welcome --json <<< "SELECT count() FROM preferences GROUP ALL;"
```
If running, query:
- `global/knowledge/dev_profile` — WHO is the developer, their style, preferences
- `global/knowledge/rejections` — what they've REJECTED (do NOT suggest these)
- `global/knowledge/preferences` — coding style, communication rules
- `global/knowledge/learnings` — mistakes to NEVER repeat (severity=critical FIRST)
- `projects/devpulse/context` — current state, active sprint, blockers
- `projects/devpulse/tasks` — pending/in_progress work
- `projects/devpulse/architecture` — rules you MUST follow
- `projects/devpulse/decisions` — decisions already made (do NOT relitigate)

### 0.2 Read Source of Truth Documents
In order:
1. `CLAUDE.md` (this project's root instructions)
2. `scripts/surrealdb/ARCHITECTURE.md` (database architecture)
3. Active sprint doc (from `projects/devpulse/context` or ask)
4. `interfaces/desktop/src/lib/design/MASTER-PLAN.md` (ColdLight architecture)
5. `interfaces/desktop/src/lib/design/coldlight.config.ts` (ColdLight config)

### 0.3 Verify What's On Disk
Do NOT assume files exist. Check:
- Run `ls` on directories you plan to modify
- Read files you plan to edit (FULL file, not just grep)
- Check git status for uncommitted changes
- Check what branch you're on

### 0.4 Check Running Services
```bash
# SurrealDB
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --hide-welcome <<< "INFO FOR ROOT;"

# Dev server (if relevant)
# Tauri (if relevant)
```

---

## Phase 1: Declare (BEFORE any work)

### 1.1 State What You Know
Tell the developer:
- What project context you loaded
- What sprint/task you think is active
- What architecture rules apply
- What rejections you found (things NOT to suggest)

### 1.2 State What You DON'T Know
Be explicit:
- What files you haven't read yet
- What assumptions you're making
- What questions you need answered

### 1.3 Restate the Task
In your own words, describe what the developer asked for. Let them correct you BEFORE you start.

### 1.4 Declare Your Plan
- What files you'll create/modify
- What order
- What verification steps (typecheck, build, test)
- What you will NOT touch

---

## Phase 2: Execute (NOW you can write code)

### Rules During Execution
1. **Schema-first** — if a schema exists, follow it. Do not invent your own structure.
2. **Config-driven** — if there's a config file, read it and follow it.
3. **Verify after each change** — typecheck/build after every file modification.
4. **No phantom code** — do not write code that references files/functions that don't exist yet.
5. **No scope creep** — do exactly what was asked. Nothing more.
6. **No hardcoding** — use variables, config, tokens. Never magic strings.
7. **No overriding** — ColdLight owns the UI. Do not scope CSS to your feature. Do not bypass the design system.
8. **Fail loud** — if something doesn't work, say so immediately. Do not silently skip it.

### After Each Task
- Mark it complete in TodoWrite
- State what was done and what changed
- If anything unexpected happened, report it

---

## Anti-Patterns (Things That Get You Fired)

- Writing code without reading the file first
- Assuming a directory structure without checking
- Proposing a plan without reading the existing architecture
- Suggesting something that's in the rejections table
- Relitigating a decision that's already been made
- Generating stub/placeholder/empty code and calling it "done"
- Using `any` types, `Record<string, unknown>`, or untyped objects when schemas exist
- Asking "want me to do X?" when the user already said to do X
- Wrapping an answer in "Let me..." or "I'll..." — just DO it

---

## Memory Budget (What to Load, Priority Order)

| Priority | Source | What | Why |
|----------|--------|------|-----|
| 1 | dev_profile | Developer identity | Attune communication + approach |
| 2 | rejections | Absolute no-go items | Prevent "I already said no" loop |
| 3 | learnings (critical) | Past mistakes | Never repeat |
| 4 | context | Active state | Know where we are |
| 5 | architecture | Rules | Know what's enforced |
| 6 | decisions | Past choices | Don't relitigate |
| 7 | tasks | Work items | Know what's pending |
| 8 | preferences | Style prefs | Code the right way |
| 9 | patterns | Best practices | Follow them |
| 10 | learnings (major/minor) | More lessons | Additional context |
