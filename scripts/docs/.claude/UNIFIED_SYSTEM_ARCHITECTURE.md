# DevPulse Unified System Architecture

**Date**: 2026-03-07
**Status**: MASTER REFERENCE — living document
**Owner**: Jesse (EonsofStupid)

---

## What This Is

One system. Three surfaces. One database. One identity.

```
                         ┌─────────────────────────┐
                         │     DEVELOPER (You)      │
                         │   dev_profile + prefs    │
                         │   identity is ALWAYS     │
                         │   loaded, never lost     │
                         └─────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
   ┌──────────▼──────────┐ ┌──────▼───────┐ ┌──────────▼──────────┐
   │   VibePulse (VS Code) │ │ Claude Code  │ │  DevPulse (Desktop)  │
   │   Addon to DevPulse   │ │   Hooks      │ │  Tauri + Rust        │
   │   Popup teaching UI   │ │   Skills     │ │  Embedded SurrealDB  │
   │   SurrealDB manager   │ │   Memory     │ │  Clyffy kernel      │
   │   Lesson engine       │ │   Preflight  │ │  ColdLight UI        │
   └──────────┬────────────┘ └──────┬───────┘ └──────────┬──────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │  SurrealDB Standalone (8822)   │
                    │  global/knowledge              │
                    │  projects/{project}            │
                    │  agents/{agent}                │
                    │  ONE instance, ALL tools share │
                    └───────────────────────────────┘
```

---

## The Three Surfaces

### 1. VibePulse — VS Code Extension (Addon to DevPulse)

**What it is**: A layman-friendly VS Code extension that teaches DevPulse concepts through beautiful popup UI, interactive lessons, and proactive guidance. Works independently but is designed as a companion to DevPulse.

**Location**: `D:\localdev\deps\vibepulse\`

**What it does TODAY (verified)**:
- Boots 4 embedded databases (SurrealDB, PGlite, DuckDB, Prisma/SQLite)
- 10 VS Code commands, @pulse chat participant
- SurrealDB Manager (standalone server devtool)
- Lesson engine with 3 getting-started lessons + 9 guides
- TeachingCard component (layman + technical explanations)
- First-run welcome notification + auto-open sidebar
- Status bar: project mode indicator (dev/customer/untracked)
- Auto-injects context into VS Code LLM chat API
- Syncs decisions to `.github/copilot-instructions.md`

**What it needs (gaps)**:
- No VS Code walkthrough API usage (native walkthroughs for onboarding)
- No overlay popups or toast notifications for proactive guidance
- Lessons are structured JSON but no trigger system (proactive "hey, try this")
- Not connected to DevPulse preflight system
- Not using DevPulse platform terminology consistently in UI

**Architecture principle**: `platform/` is pure TS (zero VS Code imports). `shells/vscode/` is a thin adapter. The lesson engine, memory engine, and config engine are portable — they can run in DevPulse desktop, CLI, or MCP server without changes.

### 2. Claude Code — Hooks + Skills + Memory

**What it is**: The AI agent interface. Hooks persist context across sessions. Skills execute platform-specific operations. Memory compounds — every session makes the next one smarter.

**Location**: `D:\localdev\platform_devpulse\.claude\`

**What it does TODAY (verified)**:
- 3 hooks exist (restore-memory, save-state, save-chat) — NOW fixed to port 8822 + correct namespaces
- 9 skills defined (sprint, planning, fixes, corrections, parkinglot, review, explain, scan-project, cl-primitive-verify)
- 8 preflight checks (domain-boundaries, typed-routes, naming, primitive-structure, no-style-primitives, aria-primitives, taxonomy-alignment, component-structure)

**What it needs (from SPRINT-BANTER-UNIFIED)**:
- Hooks need session lifecycle (create session, link records, close session)
- `/banter commit` skill not created yet
- SessionEnd hook doesn't exist
- PostToolUse file tracking hook doesn't exist
- Preflight not integrated into hooks (could run as PreToolUse validator)

### 3. DevPulse — Desktop Platform

**What it is**: The Tauri desktop app. Embedded SurrealDB runs inside the binary. Clyffy kernel orchestrates AI workloads. ColdLight renders the UI. Zero external dependencies at runtime.

**Location**: `D:\localdev\platform_devpulse\`

**What it does TODAY (verified)**:
- Tauri 2.0 boots, progressive hydration shell
- 4 stores boot (LibSQL, DuckDB, SurrealDB embedded, Moka cache)
- Platform health monitoring with StatusBar
- `fetch_dashboard` Tauri command queries all stores
- Kernel: SurrealAdapter (355 lines, full graph + persistence)
- IP protection: `ip_term!()` macro, 390 kernel term mappings
- ColdLight: 87+ primitives, 80+ components, recipe system, token pipeline

**What it needs**:
- Hub dashboards (OverMind, WiredFront, DevForge, Clyffy, DevPulse)
- Data flow from standalone SurrealDB → embedded instance
- Lesson rendering via VibePulse bridge
- Chat UI beyond plain text

---

## The Database — Single Source of Truth

### Standalone Instance (Dev Machine, Port 8822)

Every AI tool connects here. Claude, Cursor, Copilot, VibePulse — all read/write to the same namespaces.

```
SurrealDB v3.0.2 (localhost:8822, surrealkv)
│
├── NS: global                              CROSS-PROJECT, CROSS-AGENT
│   └── DB: knowledge
│       ├── TABLE: dev_profile              ★ NEW — developer identity graph
│       ├── TABLE: preferences              Coding style, communication rules (15 rows)
│       ├── TABLE: patterns                 Language/framework best practices (5 rows)
│       ├── TABLE: decisions                Cross-project architectural decisions
│       ├── TABLE: learnings                Mistakes + correct approaches (11 rows)
│       └── TABLE: rejections              ★ NEW — what NOT to do, anti-patterns
│
├── NS: projects                            PER-PROJECT DATA
│   └── DB: devpulse
│       ├── TABLE: architecture             Project arch rules (16 rows)
│       ├── TABLE: patterns                 Project-specific patterns (5 rows)
│       ├── TABLE: context                  Active sprint, blockers, state (5 rows)
│       ├── TABLE: decisions                Project decisions + trade-offs (4 rows)
│       ├── TABLE: tasks                    Work items with state tracking
│       ├── TABLE: file_conventions         Naming patterns, suffixes, locations (8 rows)
│       ├── TABLE: commits                  Session progress log (conventional commits)
│       ├── TABLE: lesson_progress          Lesson completion tracking
│       └── TABLE: lesson_replays           Lesson session playback
│
└── NS: agents                             PER-AGENT ISOLATED DATA
    └── DB: claude
        ├── TABLE: sessions                 Session metadata (linked via record refs)
        ├── TABLE: chat                     Conversation log (→ session record link)
        ├── TABLE: files_touched            File operations (→ session record link)
        └── TABLE: blockers                 Things that blocked progress (→ session record link)
```

### What's New (★)

**`dev_profile`** — Developer identity. Not flat KV like preferences. A structured document:

```surql
DEFINE TABLE dev_profile SCHEMAFULL;
DEFINE FIELD handle           ON dev_profile TYPE string;        -- "EonsofStupid"
DEFINE FIELD experience_level ON dev_profile TYPE string;        -- "senior", "staff", "principal"
DEFINE FIELD primary_langs    ON dev_profile TYPE array<string>; -- ["typescript", "rust", "svelte"]
DEFINE FIELD philosophy       ON dev_profile TYPE string;        -- "local-first, own your stack, anti-cloud-wrapper"
DEFINE FIELD communication    ON dev_profile TYPE object;        -- { style: "direct", triggers: [...], values: [...] }
DEFINE FIELD learning_style   ON dev_profile TYPE string;        -- "learn by doing, teach without forcing, DRY proactive"
DEFINE FIELD tool_opinions    ON dev_profile TYPE object;        -- { svelte: "love", react: "use for work", ... }
DEFINE FIELD identity_terms   ON dev_profile TYPE object;        -- { coldlight: "my design system", banter: "my memory", ... }
DEFINE FIELD updated_at       ON dev_profile VALUE time::now();
```

This is the IDENTITY tier in VibePulse's memory budget — always loaded, never truncated, never lost. The welcome-tour lesson collects the initial data. Sessions compound it.

**`rejections`** — Explicit anti-patterns. Not just "wrong_action" in learnings, but standalone records of things that were explicitly rejected with full context:

```surql
DEFINE TABLE rejections SCHEMAFULL;
DEFINE FIELD what              ON rejections TYPE string;        -- "molecules directory"
DEFINE FIELD why               ON rejections TYPE string;        -- "deleted concept, never reference again"
DEFINE FIELD rejected_at       ON rejections TYPE datetime DEFAULT time::now();
DEFINE FIELD rejected_in       ON rejections TYPE option<string>; -- "sprint X" or "session Y"
DEFINE FIELD embedding         ON rejections TYPE option<array<float>>;
DEFINE INDEX idx_rejections_vector ON rejections FIELDS embedding HNSW DIMENSION 1536 DIST COSINE TYPE F32;
```

---

## Memory Budget (Context Management)

Every hook/tool that injects context follows this budget:

```
IDENTITY (dev_profile)                    — ALWAYS included, ~200 tokens
CRITICAL LEARNINGS (severity=critical)    — ALWAYS included, ~500 tokens
ACTIVE CONTEXT (sprint, blockers, tasks)  — ALWAYS included, ~300 tokens
PATTERNS (approved solutions)             — Up to 30% of remaining budget
DECISIONS (architecture choices)          — Up to 40% of remaining budget
REJECTIONS (what NOT to do)               — Up to 15% of remaining budget
SESSION HISTORY (recent sessions)         — Fills remaining budget
```

Total budget: ~2000 tokens for session-start context injection. Overflow: lower-priority items truncated.

---

## Portability Contract

**Clone + Seed + Run = Full System**

```bash
# 1. Clone the repo
git clone <repo> && cd platform_devpulse

# 2. Start SurrealDB
scripts/surrealdb/start-surreal.cmd    # → port 8822, surrealkv

# 3. Seed everything
scripts/surrealdb/seed-all.cmd         # → 7 schemas + seed data

# 4. Open in VS Code
code .                                 # → VibePulse activates, connects to 8822

# 5. Start Claude Code
claude                                 # → SessionStart hook fires, context restores

# 6. Start DevPulse
cd interfaces/desktop && pnpm dev      # → Tauri boots, embedded SurrealDB initializes
```

Any machine. Full context in seconds. No cloud. No accounts. No API keys for memory.

---

## Execution Phases (Sprint Order)

### Phase A: Memory Foundation (SPRINT-BANTER-UNIFIED)
**Status**: Plan written, awaiting approval
- Fix all hooks (session lifecycle, record links, file tracking)
- Add dev_profile + rejections tables to schema-global.surql
- Create /banter commit skill
- Restore archive script
- Align launcher to port 8822

### Phase B: Platform Reality (SPRINT-PLATFORM-REALITY)
**Status**: Plan written, awaiting approval
- Fix broken recipe wiring
- Wire StatusBar icons
- Build hub dashboards (OverMind, WiredFront, DevForge, Clyffy, DevPulse)
- Boost visual token values

### Phase C: VibePulse as DevPulse Addon
**Status**: NEEDS PLAN
- Add VS Code walkthrough API for onboarding
- Wire VibePulse to standalone SurrealDB on 8822 (currently hardcoded but not tested)
- Build proactive popup system (toast notifications triggered by lesson engine events)
- DevPulse-specific lesson pack (using platform terminology)
- Preflight integration (run checks from VibePulse sidebar)
- TeachingCard popups during common dev tasks

### Phase D: Data Bridge (Standalone → Embedded)
**Status**: Design only in SPRINT-BANTER-UNIFIED Phase 4
- Export global + projects knowledge to JSON
- Import into embedded SurrealDB at build/boot
- IP protection mapping verified
- VibePulse lesson-engine bridge consumed by DevPulse Svelte UI

### Phase E: Skills + Preflight Integration
**Status**: NEEDS PLAN
- Preflight checks as PostToolUse hooks (real-time enforcement)
- Skills wired to SurrealDB (commit saves to DB, not just git)
- /scan-project writes findings to projects/{project}/architecture
- /review writes findings to projects/{project}/decisions

---

## File Locations (Verified Real)

### SurrealDB Schemas
```
scripts/surrealdb/
├── schema-global.surql           # global/knowledge tables (80 lines)
├── schema-projects.surql         # projects/devpulse tables (162 lines)
├── schema-agents.surql           # agents/claude tables + APIs (133 lines)
├── schema-access.surql           # users, roles, permissions
├── schema-lessons.surql          # lesson_progress + lesson_replays (67 lines)
├── seed-global.surql             # preferences, learnings, patterns
├── seed-devpulse.surql           # architecture rules, context, conventions
├── seed-all.cmd                  # Seeds all 6 files in order
├── start-surreal.cmd             # Launches standalone instance
├── banter-archive.js             # Weekly cleanup (NEEDS RESTORE)
└── ARCHITECTURE.md               # Dual-instance model docs
```

### Claude Code Hooks + Skills
```
.claude/
├── hooks/
│   ├── restore-memory.js         # SessionStart: context restore (FIXED)
│   ├── save-state.js             # PreCompact: save state (FIXED)
│   ├── save-chat.js              # UserPromptSubmit: save messages (FIXED, needs session link)
│   ├── session-end.js            # SessionEnd: close session (NEEDS CREATE)
│   └── track-files.js            # PostToolUse: file tracking (NEEDS CREATE)
├── skills/
│   ├── sprint/SKILL.md           # Sprint execution (24 lines)
│   ├── planning/SKILL.md         # Research mode (94 lines)
│   ├── fixes/SKILL.md            # Task executor (93 lines)
│   ├── corrections/SKILL.md      # Issue fixer (75 lines)
│   ├── parkinglot/SKILL.md       # Blocker handler (76 lines)
│   ├── review/SKILL.md           # Code review (34 lines)
│   ├── explain/SKILL.md          # Layman explanation (22 lines)
│   ├── scan-project/SKILL.md     # Codebase scan (25 lines)
│   ├── cl-primitive-verify/SKILL.md  # Primitive verification (158 lines)
│   └── banter-commit/SKILL.md    # Commit to DB (NEEDS CREATE)
├── settings.json                 # Hook registrations, permissions
└── settings.local.json           # Local overrides
```

### VibePulse Extension
```
D:\localdev\deps\vibepulse\
├── shells/vscode/extension.ts    # Boot sequence (237 lines)
├── platform/
│   ├── lesson-engine/            # Pure TS, portable
│   │   ├── devpulse-bridge.ts    # Adapter for DevPulse consumption (241 lines)
│   │   ├── loader.ts             # Lesson pack loader
│   │   ├── evaluator.ts          # Response evaluation
│   │   ├── progress-tracker.ts   # Step progression
│   │   ├── session-recorder.ts   # Replay recording
│   │   └── types.ts              # 13 interaction types
│   ├── memory-engine/
│   │   ├── schema.ts             # Runtime schema SSOT (1300+ lines)
│   │   ├── client.ts             # Embedded SurrealDB client
│   │   └── standalone-client.ts  # WebSocket client for standalone (283 lines)
│   └── config-engine/            # PGlite project registry
├── webview-ui/                   # React 19 sidebar
├── content/lessons/              # 3 lessons + 9 guides
└── docs/ARCHITECTURE.md          # Full architecture (480 lines)
```

### Preflight System
```
scripts/docs/preflight/
├── engine/preflight.ts           # Orchestrator (312 lines)
├── checks/
│   ├── check.domain-boundaries.ts    (230 lines)
│   ├── check.typed-routes.ts         (196 lines)
│   ├── check.naming.ts              (235 lines)
│   ├── check.primitive-structure.ts  (79 lines)
│   ├── check.no-style-primitives.ts  (63 lines)
│   ├── check.aria-primitives.ts      (81 lines)
│   ├── check.taxonomy-alignment.ts   (102 lines)
│   └── check.component-structure.ts  (79 lines)
└── policy/cowlevel.policy.json   # Check configuration
```

### Kernel (Sensitive IP)
```
kernel/devpulse-clyffy/src/
├── cortex/persistence/
│   └── surreal.rs                # Embedded SurrealDB adapter (355 lines, REAL)
├── cortex/minions/               # Sub-agents (Guardian, Diary)
├── cortex/reasoning/             # HMM, chains
└── cortex/persona/               # AI persona system (Clyffy default)

systems/devpulse-engine/src/
├── ip/
│   ├── mod.rs                    # ip_term!() macro (104 lines)
│   └── redaction.rs              # TraceDetail conditional compilation
├── ip/kernel_terms.toml          # 390 term mappings
└── platform/stores/graph.rs      # Public GraphStore wrapper (49 lines)
```

---

## Terminology (Platform-Specific, Used Everywhere)

| Internal (Kernel) | Public (DevPulse) | What It Is |
|---|---|---|
| Clyffy | Gus | AI orchestrator |
| Cortex | Knowledge Engine | Memory + reasoning |
| Diary | Memory Minion | Context persistence sub-agent |
| Guardian | Quality Check | Verification sub-agent |
| SurrealAdapter | Graph Store | Embedded database adapter |
| Banter | Banter | Session memory system (public name) |
| ColdLight | ColdLight | Design system (public name) |
| Minions | Assistants | Sub-agents |
| HMM | Context Switching | Reasoning algorithm |
| Rumination | Thinking Step | Deep reasoning phase |

VibePulse uses public terms. DevPulse desktop uses public terms in UI, kernel terms internally. The `ip_term!()` macro enforces this at compile time.

---

## Teaching Philosophy (DRY, Proactive, Not Forced)

From VibePulse's TeachingCard pattern:
- Every concept has a **layman** explanation and a **technical** explanation
- User chooses depth — never forced to read the technical version
- Proactive: surface guidance WHEN the user needs it, not as a manual
- DRY: teach the concept ONCE, reference it by name after that
- Platform terminology used consistently — when you learn "ColdLight", every surface calls it ColdLight

From the lesson engine:
- 13 interaction types (multiple-choice, rating-scale, code-spot, preference-card, etc.)
- Gates: check prerequisites before advancing (setting-equals, extension-installed, file-exists)
- Actions: apply-setting, install-extension, run-command, open-file
- Context collection: every response saves to SurrealDB preferences with a `contextKey`
- AI-dynamic: lessons can generate content based on collected profile

---

## What Compounds (The 1% Move)

```
Session 1: Install + seed + run welcome-tour lesson
  → dev_profile created, preferences collected
  → Claude knows who you are without asking

Session 2: Start working on DevPulse
  → SessionStart hook loads identity + context + learnings
  → Claude sees: "Senior dev. Direct communication. Svelte 5 runes. Local-first."
  → No "what framework are you using?" bullshit

Session 10: Hit a SurrealDB schema issue
  → Blocker saved to agents/claude/blockers
  → Resolution saved to global/knowledge/learnings
  → Next time ANY agent hits this: "You solved this before. Here's how."

Session 50: New project
  → Clone + seed → global knowledge carries over
  → Project-specific context starts fresh
  → Identity stays. Learnings compound. Mistakes never repeat.
```

This is what no one talks about. This is what costs $0/month and compounds forever.
