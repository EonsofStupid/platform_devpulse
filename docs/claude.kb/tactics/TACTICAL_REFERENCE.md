# CLAUDE CODE TACTICAL REFERENCE — FULL STACK 2026

| Status | `REFERENCE` | Created | `2026-03-31` |
|--------|-------------|---------|-------------|

---

## EFFORT KEYWORDS (Claude Code CLI only)

| Keyword | Thinking tokens | Use when |
|---------|----------------|----------|
| `think` | ~10K | Routine analysis |
| `think more` / `think deeply` | ~16K | Design decisions |
| `think harder` | ~24K | Complex debugging |
| `ultrathink` | ~31,999 | Architecture, migration, algorithmic |

`/effort low|medium|high` = persistent. `ultrathink` = per-turn override.
Does NOTHING in claude.ai web or API. CLI only.

## SESSION COMMANDS

| Command | When |
|---------|------|
| `/clear` | Between tasks. ALWAYS when switching domains. |
| `/compact focus on X` | At 50% context. |
| `/plan` | BEFORE multi-file work. |
| `/model sonnet` | Default. `/model opus` for architecture. |
| `/effort high` | Complex tasks. Low for mechanical. |
| `/memory` | Verify files loaded. |
| `/context` | Check usage %. |
| `/loop 5m <task>` | Recurring background task. |
| `/voice` | Push-to-talk (hold Space). |

## HALLUCINATION PREVENTION BY DOMAIN

### React / Next.js
| Wrong default | Correct 2026 | Rule |
|--------------|-------------|------|
| Pages Router | App Router | `App Router ONLY` |
| getServerSideProps | Server Components async | Server-side fetch |
| useState for server data | Server Components default | `"use client" ONLY for hooks/events` |
| useEffect fetch | TanStack Query or server | No useEffect for data |
| any type | Strict TypeScript | `NEVER use any` |
| Missing Suspense | Suspense boundaries | Wrap async in Suspense |

### Supabase
| Wrong default | Correct | Rule |
|--------------|---------|------|
| Direct DB from client | API layer / server actions | Server-side only |
| No RLS | Row Level Security | ALL tables MUST have RLS |
| anon key everywhere | Service role server-only | Key separation |

### Prisma
| Wrong default | Correct | Rule |
|--------------|---------|------|
| No `prisma generate` | Generate after schema edit | EVERY schema change |
| `db push` in prod | `migrate dev` / `migrate deploy` | NEVER push in prod |
| Modifying migrations | Immutable | NEVER edit migration files |

### Drizzle
| Wrong default | Correct | Rule |
|--------------|---------|------|
| Prisma syntax | SQL-like builder | Different API entirely |
| Missing `prepare: false` | Required for Supabase pooling | Set in connection config |

### Remix
| Wrong default | Correct | Rule |
|--------------|---------|------|
| Next.js patterns | loader/action model | `loader()` for GET, `action()` for POST |
| Client fetch | useLoaderData() | No client useEffect fetch |

### General Anti-Hallucination
| Domain | #1 hallucination | Kill shot |
|--------|-----------------|-----------|
| Any library | Invents API surface | **Context7 MCP: fetch docs before uncertain API** |
| Rust crates | Invents methods | Context7 for current docs |
| Tailwind | Invents classes | Tailwind IntelliSense validation |
| npm packages | Invents packages | Verify against package.json |

## HOOK ARCHITECTURE (every project)

| Hook | Event | Matcher | Purpose |
|------|-------|---------|---------|
| Auto-format | PostToolUse | Write\|Edit | prettier/rustfmt after edit |
| Security gate | PreToolUse | Bash | Block rm -rf, force push, pip, docker |
| Verify gate | Stop | (all) | Exit 2 if typecheck fails |
| Semantic check | Stop | (all) | Prompt hook: "matches intent?" |
| Config watch | FileChanged | .env*\|Cargo.toml | Warn on config change |
| Context save | PreCompact | (all) | Save state before destruction |
| Session inject | SessionStart | (all) | Branch, git status, service health |

## EFFORT-TO-TASK MATRIX

| Task | Effort | Trigger | Sub-agent? |
|------|--------|---------|------------|
| Variable rename | Low | none | No |
| Write function | Medium | none | No |
| Code review | High | "think harder" | Optional |
| Debug complex bug | High | "ultrathink" | No |
| Multi-file refactor | High | `/plan` first | Yes (5-8 files each) |
| Architecture decision | High | `/plan` + `ultrathink` | No |
| Migration | High | `ultrathink` | Yes (parallel agents) |
| CSS/styling | Low | none | No |
