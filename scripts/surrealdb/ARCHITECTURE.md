# SurrealDB Architecture — DevPulse Platform

> **Version:** SurrealDB 3.0.0
> **Updated:** 2026-02-18
> **Purpose:** AI agent memory, project knowledge persistence, cross-session continuity

---

## Dual-Instance Model

DevPulse uses TWO completely separate SurrealDB instances. They share ZERO data. Different processes, different storage, different auth.

### Instance 1: EMBEDDED (Platform Binary — Maestro/Clyffy)

Compiles into the Rust binary via `surrealdb` crate. No server process. No network. Ships with the app.

```toml
# Cargo.toml (workspace)
surrealdb = { version = "2.6", default-features = false, features = ["kv-mem", "kv-rocksdb"] }
```

```rust
use surrealdb::Surreal;
use surrealdb::engine::local::RocksDb;

let db = Surreal::new::<RocksDb>("./data/maestro.db").await?;
db.use_ns("maestro").use_db("orchestration").await?;
```

**Contains:** Sensitive IP. AI orchestration state. CAG/RAG caches. Minion tasks. Knowledge graphs.
**Access:** Platform binary only. Never exposed to network.

### Instance 2: STANDALONE (Dev Machine — AI Agent Memory)

Separate server binary running on the dev machine. Any AI tool connects over WebSocket.

```bash
surreal start --user root --pass root --bind 127.0.0.1:8000 "surrealkv://D:/localdev/deps/surrealdb/data"
```

**Contains:** AI agent memory. Session context. Learnings. Architecture rules. Project knowledge.
**Access:** Any AI tool via WebSocket (Claude MCP, Cursor, Copilot, etc.)

---

## Standalone Instance — Namespace Architecture

```
SurrealDB v3 Standalone (localhost:8000)
│
├── NS: global                         READ-ONLY for agents
│   └── DB: knowledge                  Cross-project shared knowledge
│       ├── TABLE: preferences         Coding style, communication rules
│       ├── TABLE: patterns            Language/framework best practices
│       ├── TABLE: decisions           Cross-project architectural decisions
│       └── TABLE: learnings           Mistakes + correct approaches (CRITICAL)
│
├── NS: projects                       Per-project data (WRITE by owning agent)
│   ├── DB: devpulse                   DevPulse-specific knowledge
│   │   ├── TABLE: architecture        Project arch rules + enforcement
│   │   ├── TABLE: patterns            Project-specific patterns (coldlight, domains, etc.)
│   │   ├── TABLE: context             Current state: active sprint, blockers, active work
│   │   ├── TABLE: decisions           Project decisions + trade-offs
│   │   ├── TABLE: tasks               Work items with state tracking
│   │   ├── TABLE: file_conventions    Naming patterns, suffixes, locations
│   │   └── TABLE: commits             Session progress log (conventional commit format)
│   └── DB: {any_project}              Same table set, provisioned via API or manual
│
└── NS: agents                         Per-agent data (agents see ONLY their own DB)
    ├── DB: claude                     Claude Code sessions
    │   ├── TABLE: sessions            Session metadata (start, end, summary)
    │   ├── TABLE: chat                Conversation log (role, content, turn)
    │   ├── TABLE: files_touched       File operations per session
    │   └── TABLE: blockers            Things that blocked progress
    ├── DB: cursor                     Cursor AI (same table set)
    └── DB: {any_agent}                Auto-provisioned, same table set
```

---

## Access Control Model

### Levels

| Level | Who | What They Can Do |
|-------|-----|------------------|
| **Root** | Admin (you) | Everything. Create namespaces, users, full CRUD. |
| **NS: global — VIEWER** | All agents | READ global/knowledge. Cannot write. |
| **NS: projects — EDITOR** | Authenticated agents | READ/WRITE their assigned project DB. |
| **NS: agents — EDITOR** | Authenticated agents | READ/WRITE only their own agent DB. |

### User Definitions

```surql
-- Root: created at server start (--user root --pass root)

-- Global: read-only for all agents
USE NS global;
DEFINE USER agent_reader ON NAMESPACE PASSWORD 'agent_readonly_2026' ROLES VIEWER;

-- Projects: per-agent write access
USE NS projects;
DEFINE USER claude ON NAMESPACE PASSWORD 'claude_projects_2026' ROLES EDITOR;
DEFINE USER cursor ON NAMESPACE PASSWORD 'cursor_projects_2026' ROLES EDITOR;

-- Agents: per-agent isolated write access
USE NS agents;
DEFINE USER claude ON NAMESPACE PASSWORD 'claude_agent_2026' ROLES EDITOR;
DEFINE USER cursor ON NAMESPACE PASSWORD 'cursor_agent_2026' ROLES EDITOR;
```

### Row-Level Security (Future)

For record-level access control within shared project databases:

```surql
DEFINE ACCESS agent_access ON DATABASE TYPE RECORD
  SIGNUP (CREATE agent SET name = $name, token = crypto::argon2::generate($token))
  SIGNIN (SELECT * FROM agent WHERE name = $name AND crypto::argon2::compare(token, $token))
  DURATION FOR TOKEN 24h, FOR SESSION 7d;

DEFINE TABLE commits SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true
    FOR create, update, delete WHERE created_by = $auth.name;
```

---

## DEFINE API — Self-Service Provisioning (v3 Feature)

Agents can provision new project databases and agent databases via API endpoints.

```surql
-- In NS: projects, DB: _registry (admin database)
DEFINE API "/provision" FOR post
  THEN {
    -- Creates a new project DB with standard table set
    -- Agent sends: { "project": "my_project" }
    LET $project = $request.body.project;
    -- Root-level operation: create DB + tables
    RETURN { status: 201, body: { provisioned: $project } };
  }
  PERMISSIONS FULL;
```

> **Note:** `DEFINE API` endpoints scope to `/api/:namespace/:database/:endpoint`.
> Full provisioning requires root access to create namespaces/databases.
> For now, provisioning is done via the seed scripts. DEFINE API endpoints
> will be added once the base schema is stable.

---

## Table Schemas — Global Knowledge

### preferences
| Field | Type | Description |
|-------|------|-------------|
| category | string | code, git, communication, workflow |
| key | string | Preference identifier (UNIQUE) |
| value | string | Preference value |
| notes | option\<string\> | Context / explanation |
| created_at | datetime | Auto-set |

### patterns
| Field | Type | Description |
|-------|------|-------------|
| name | string | Pattern name |
| category | string | svelte, rust, typescript, architecture, css |
| description | string | What the pattern is |
| example | option\<string\> | Code example |
| anti_pattern | option\<string\> | What NOT to do |
| source | option\<string\> | Where learned |
| created_at | datetime | Auto-set |

### decisions
| Field | Type | Description |
|-------|------|-------------|
| title | string | Decision title |
| context | string | What prompted the decision |
| decision | string | What was decided |
| reasoning | option\<string\> | Why |
| alternatives | option\<array\<string\>\> | What was rejected |
| created_at | datetime | Auto-set |

### learnings
| Field | Type | Description |
|-------|------|-------------|
| category | string | Topic area |
| trigger | string | What situation triggers this |
| wrong_action | string | What was done wrong |
| correct_action | string | What to do instead |
| severity | string | critical, major, minor |
| created_at | datetime | Auto-set |

---

## Table Schemas — Project Data

### architecture
| Field | Type | Description |
|-------|------|-------------|
| layer | string | routes, domains, design, sys, engine, maestro |
| rule | string | Rule identifier |
| description | string | Full description |
| enforced_by | option\<string\> | preflight, biome, scanner, etc. |
| examples | option\<array\<string\>\> | Correct examples |
| anti_examples | option\<array\<string\>\> | Wrong examples |
| created_at | datetime | Auto-set |

### patterns (project-scoped)
| Field | Type | Description |
|-------|------|-------------|
| component | string | What component/area this applies to |
| pattern_type | string | composition, styling, state, a11y, signal |
| description | string | Full description |
| code_example | option\<string\> | Code snippet |
| created_at | datetime | Auto-set |

### context
| Field | Type | Description |
|-------|------|-------------|
| key | string | Context key (UNIQUE) |
| value | any | Context value |
| priority | int | Higher = more important (loaded first) |
| updated_at | datetime | Auto-set |

### decisions (project-scoped)
| Field | Type | Description |
|-------|------|-------------|
| sprint | option\<string\> | Which sprint this decision belongs to |
| title | string | Decision title |
| decision | string | What was decided |
| reasoning | option\<string\> | Why |
| trade_offs | option\<string\> | What was sacrificed |
| created_at | datetime | Auto-set |

### tasks
| Field | Type | Description |
|-------|------|-------------|
| content | string | Task description |
| status | string | pending, in_progress, completed, blocked, cancelled |
| sprint | option\<string\> | Sprint association |
| priority | int | Higher = more important |
| created_at | datetime | Auto-set |
| updated_at | datetime | Auto-set |

### file_conventions
| Field | Type | Description |
|-------|------|-------------|
| pattern | string | Glob pattern |
| convention | string | What the convention is |
| suffix | option\<string\> | File suffix |
| location | string | Where these files live |
| created_at | datetime | Auto-set |

### commits
| Field | Type | Description |
|-------|------|-------------|
| type | string | feat, fix, refactor, chore, docs, test, style, perf, breaking, revert |
| scope | option\<string\> | Component/area |
| message | string | Commit message |
| body | option\<string\> | Extended description |
| files | array | Files affected |
| session_id | string | Which session |
| agent | string | Which AI agent made this commit |
| created_at | datetime | Auto-set |

---

## Table Schemas — Agent Data

### sessions
| Field | Type | Description |
|-------|------|-------------|
| session_id | string | Unique session identifier |
| project | string | Which project |
| started_at | datetime | Auto-set |
| ended_at | option\<datetime\> | When session ended |
| summary | option\<string\> | Session summary |
| message_count | int | Messages in session |

### chat
| Field | Type | Description |
|-------|------|-------------|
| role | string | user, assistant, system |
| content | string | Message content |
| session_id | string | Which session |
| turn | int | Turn number |
| created_at | datetime | Auto-set |

### files_touched
| Field | Type | Description |
|-------|------|-------------|
| path | string | File path |
| action | string | created, modified, deleted, read |
| session_id | string | Which session |
| created_at | datetime | Auto-set |

### blockers
| Field | Type | Description |
|-------|------|-------------|
| description | string | What's blocked |
| category | string | Topic area |
| resolved | bool | Whether resolved |
| resolution | option\<string\> | How it was resolved |
| created_at | datetime | Auto-set |

---

## Hooks & Skills (Claude Code Integration)

### Session Start Hook

Automatically restores context from SurrealDB on every session start and post-compact.

**Location:** `~/.claude/hooks/on-session-start.js`
**Trigger:** session-start, post-compact
**Action:** Queries global/knowledge + projects/devpulse + agents/claude, outputs structured context

### File Write Hook

Logs file operations to agents/claude/files_touched.

**Location:** `~/.claude/hooks/on-file-write.js`
**Trigger:** post-tool (Write, Edit, Read)
**Action:** INSERT into files_touched

### Banter Commit Skill

`/banter commit type(scope): message` — saves conventional commit to projects/{project}/commits.

**Location:** `~/.claude/skills/banter-commit.md` + `banter-commit.js`

### Weekly Archive

Moves records older than 30 days to JSON exports. Keeps DB lean.

**Location:** `scripts/surrealdb/archive.js`
**Schedule:** Weekly (Windows Task Scheduler or cron)

---

## MCP Configuration

```json
{
  "mcpServers": {
    "surrealdb": {
      "command": "uvx",
      "args": ["surreal-mcp"],
      "env": {
        "SURREAL_URL": "ws://localhost:8000/rpc",
        "SURREAL_USER": "root",
        "SURREAL_PASSWORD": "root",
        "SURREAL_NAMESPACE": "projects",
        "SURREAL_DATABASE": "devpulse"
      }
    }
  }
}
```

> **Note:** MCP connects as root for now. Once DEFINE ACCESS record-level auth
> is wired, MCP will authenticate as a scoped agent user.

---

## Launcher

**Double-click launcher:** `scripts/surrealdb/start-surreal.cmd`

```batch
@echo off
echo Starting SurrealDB v3 standalone...
echo Data: D:\localdev\deps\surrealdb\data
echo Bind: 127.0.0.1:8000
echo.
surreal start --user root --pass root --bind 127.0.0.1:8000 --log info "surrealkv://D:/localdev/deps/surrealdb/data"
```

---

## Files

```
scripts/surrealdb/
├── ARCHITECTURE.md              # This file
├── schema-global.surql          # NS: global / DB: knowledge
├── schema-projects.surql        # NS: projects / DB: devpulse (template for all projects)
├── schema-agents.surql          # NS: agents / DB: claude (template for all agents)
├── schema-access.surql          # Access control: users, roles, permissions
├── seed-global.surql            # Global preferences, patterns, learnings
├── seed-devpulse.surql          # DevPulse architecture rules, context, conventions
├── start-surreal.cmd            # Double-click launcher (Windows)
├── seed-all.cmd                 # Seeds all schemas + data (Windows)
├── provision.surql              # Creates new project/agent DBs from templates
└── archive.js                   # Weekly cleanup script
```

---

## Embedded Instance Namespaces (Maestro)

For the embedded SurrealDB in the platform binary:

```
Embedded SurrealDB (RocksDB, ships with app)
├── NS: maestro
│   ├── DB: orchestration      AI workload state, minion tasks, scheduling
│   ├── DB: knowledge          Knowledge graphs, embeddings metadata
│   └── DB: cache              CAG/RAG cache, hot context
├── NS: platform
│   ├── DB: config             App configuration, user preferences
│   └── DB: state              UI state persistence, layout saves
```

**This instance is NOT accessible to AI tools.** It's compiled into the binary. Sensitive IP stays here.

---

## All Platform Databases (Full Picture)

| Database | Crate/Binary | Purpose | Embedded? |
|----------|-------------|---------|-----------|
| SurrealDB (embedded) | `surrealdb 2.6` kv-rocksdb | Maestro state, knowledge graphs | Yes |
| SurrealDB (standalone) | `surreal.exe` v3.0.0 | AI agent memory, project knowledge | No (server) |
| DuckDB | `duckdb 1.1` | Analytics, OLAP queries | Yes |
| libSQL | `libsql 0.9` | Relational data, user data | Yes |
| Moka | `moka 0.12` | In-memory cache (volatile) | Yes |
| Fjall | `fjall 2.0` | Persistent KV store | Yes |

---

**ColdLight is the public API. SurrealDB is the memory. The owner directs everything.**
