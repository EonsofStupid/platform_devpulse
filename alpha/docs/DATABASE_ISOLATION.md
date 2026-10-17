# Database Isolation: Lab vs Desktop

## THE GOLDEN RULE

**Lab and Desktop NEVER share databases. EVER.**

```
LAB (Internal Dev Tool)              DESKTOP (User Production)
───────────────────────────          ──────────────────────────────
target/lab/                          ~/.local/share/devpulse/
├── data/                            ├── data/
│   ├── lab.db          ← LAB ONLY   │   └── devpulse.db  ← GLOBAL USER
│   ├── lab_analytics.duckdb         │
│   ├── rro/                      └── projects/
│   └── fjall/                           ├── {uuid-1}/
│                                        │   └── project.db  ← PROJECT 1
└── config/                              │
    (Lab UI settings)                    └── {uuid-2}/
                                             └── project.db  ← PROJECT 2

COMPLETELY SEPARATE                  COMPLETELY SEPARATE
NEVER TOUCHES USER DATA              NEVER TOUCHES LAB DATA
```

---

## Lab Databases (target/lab/)

### lab.db (libSQL)
**Purpose:** Lab's own operational data
- Lab config (analytics retention, poll intervals)
- Lab health metrics
- Lab-specific personas
- Developer preferences for Lab UI

**Tables:**
- `lab_config` (key/value pairs)
- `lab_sessions` (Lab usage tracking)
- `lab_health_snapshots`

### lab_analytics.duckdb (DuckDB)
**Purpose:** Lab's signal monitoring
- Tracks Engine signal emissions (SignalVariant)
- Performance metrics (latency, token counts)
- Rumination hop analysis
- DuckDB schemas: events, inferences, hops

### Initialized by:
```rust
// alpha/lab/src/state.rs
let lab_db_path = paths.data_dir.join("lab.db");
let lab_db = Database::open(&lab_db_path).await?;

let lab_analytics_path = paths.data_dir.join("lab_analytics.duckdb");
let lab_analytics = Analytics::open_with_path(&lab_analytics_path)?;
```

---

## Desktop Databases (~/.local/share/devpulse/)

### 1. Global Database (data/devpulse.db)
**Purpose:** User identity and cross-project data
- Platform config (app guidelines, legal, engine defaults)
- User config (identity, preferences, API keys)
- Project registry (UUIDs → paths mapping)
- Global voice profiles
- Global personas

**Tables:**
- `platform_config` (app-wide settings)
- `user_config` (user preferences)
- `projects` (registry with UUID→path)
- `voice_profiles` (shared across projects)
- `voice_samples` (shared across projects)
- `personas` (global personas)
- `active_models` (model selection)

### 2. Per-Project Database (projects/{uuid}/project.db)
**Purpose:** Project-specific data isolation
- Project config (overrides global settings)
- Project resources (images, documents with smart linking)
- Sessions (conversation history)
- Messages (rendered UI messages)
- Decisions (locked choices)
- Chunks (RAG embeddings)
- Lane runs (L1-L6 execution tracking)
- LLM calls (token usage)
- Governance violations (9 Umbrellas)

**Tables:**
- `project_config` (project settings)
- `project_resources` (images/documents)
- `resource_links` (smart link tracking)
- `sessions` (conversations)
- `messages` (rendered messages)
- `decisions` (locked choices)
- `chunks` (RAG chunks)
- `lane_runs` (pipeline execution)
- `llm_calls` (token tracking)
- `governance_violations` (9 Umbrellas)

### Initialized by:
```rust
// Desktop (via Tauri commands)
// Global DB
let global_db_path = paths.global_db; // ~/.local/share/devpulse/data/devpulse.db
let global_db = Database::open(&global_db_path).await?;

// Per-project DB
let project_db_path = paths.project_db(&project_uuid); // projects/{uuid}/project.db
let project_db = Database::open(&project_db_path).await?;
```

---

## Schema Organization

The `orchestrator/infra/libsql.rs` Database implementation contains ALL possible tables because it's a **generic storage layer**. But which tables exist depends on **which database file you open**:

### Lab's lab.db (when opened at target/lab/lab.db)
```sql
-- Lab-specific tables only
CREATE TABLE lab_config (...);
CREATE TABLE lab_sessions (...);
CREATE TABLE lab_health_snapshots (...);
```

### Desktop's devpulse.db (when opened at ~/.local/share/devpulse/data/devpulse.db)
```sql
-- Global user tables only
CREATE TABLE platform_config (...);
CREATE TABLE user_config (...);
CREATE TABLE projects (...);
CREATE TABLE voice_profiles (...);
CREATE TABLE personas (...);
```

### Desktop's project.db (when opened at ~/.local/share/devpulse/projects/{uuid}/project.db)
```sql
-- Per-project tables only
CREATE TABLE project_config (...);
CREATE TABLE project_resources (...);
CREATE TABLE resource_links (...);
CREATE TABLE sessions (...);
CREATE TABLE messages (...);
CREATE TABLE decisions (...);
CREATE TABLE chunks (...);
CREATE TABLE lane_runs (...);
```

**KEY INSIGHT:** It's the same Database code, but different table schemas based on the file opened.

---

## Why This Matters

### Security
- Lab CANNOT accidentally corrupt user projects
- User projects CANNOT pollute Lab's monitoring data
- Each project is isolated from other projects

### Portability
- User can copy a project folder → all data moves with it
- Lab data stays in dev environment, never ships
- User's global config persists across project switches

### Performance
- Lab's high-frequency signal monitoring doesn't lock user DBs
- Per-project DBs are smaller → faster queries
- User can delete a project → just delete the folder

### IP Protection
- Lab's analytics reveal DevPulse internals → stays internal
- User's projects are their own data → they own it
- Clean separation for licensing/distribution

---

## Access Patterns

### Lab
```rust
// Lab ONLY accesses its own databases
state.lab_db.get_lab_config("retention_days").await?;
state.lab_analytics.query_signal_metrics().await?;

// Lab NEVER calls:
// ❌ state.engine.store.get_user_config()     // WRONG
// ❌ state.engine.store.get_project_config()  // WRONG
```

### Desktop (via Tauri commands)
```rust
// Desktop accesses MULTIPLE databases:

// 1. Global config
let global_db = open_global_database().await?;
global_db.get_platform_config("max_context_tokens").await?;
global_db.get_user_config("theme").await?;
global_db.list_projects().await?;

// 2. Per-project data (DIFFERENT database instance)
let project_db = open_project_database(&project_uuid).await?;
project_db.get_project_config(&project_uuid, "max_tokens").await?;
project_db.get_messages(&session_id, 50).await?;
project_db.list_project_resources(&project_uuid, Some("image")).await?;

// Desktop NEVER calls:
// ❌ lab_db.anything()  // WRONG - doesn't even have access
```

---

## Validation Commands

```bash
# Verify Lab uses isolated databases
grep -rn "target/lab" alpha/lab/src/state.rs              # Should find Lab paths
grep -rn "lab.db\|lab_analytics.duckdb" alpha/lab/       # Lab's own DBs

# Verify Desktop uses user databases
grep -rn "\.local/share/devpulse" alpha/desktop/src-tauri/  # User paths
grep -rn "devpulse.db" alpha/desktop/                        # Global DB
grep -rn "project.db" alpha/desktop/                         # Per-project DB

# Verify NO cross-contamination
grep -rn "lab.db" alpha/desktop/                    # Should be 0
grep -rn "devpulse.db" alpha/lab/                   # Should be 0
```

---

## Migration Safety

When adding new tables:

1. **Determine ownership:** Lab-only, Global-only, or Per-project?
2. **Add to correct schema section** in orchestrator/infra/libsql.rs
3. **Document in this file** which database gets which tables
4. **Test isolation:** Verify Lab and Desktop open separate files

**Example: Adding a new table**
```rust
// orchestrator/infra/libsql.rs

const SCHEMA: &str = r#"
-- ============== LAB-ONLY TABLES ==============
CREATE TABLE IF NOT EXISTS lab_config (...);

-- ============== GLOBAL USER TABLES ==============
CREATE TABLE IF NOT EXISTS platform_config (...);
CREATE TABLE IF NOT EXISTS user_config (...);

-- ============== PER-PROJECT TABLES ==============
CREATE TABLE IF NOT EXISTS project_config (...);
CREATE TABLE IF NOT EXISTS project_resources (...);
"#;
```

Then initialize with correct paths:
```rust
// Lab
let lab_db = Database::open(Path::new("target/lab/lab.db")).await?;

// Desktop Global
let global_db = Database::open(Path::new("~/.local/share/devpulse/data/devpulse.db")).await?;

// Desktop Per-Project
let project_db = Database::open(Path::new("~/.local/share/devpulse/projects/{uuid}/project.db")).await?;
```

---

## The Big Picture

```
                    Database (libsql.rs)
                    ─────────────────────
                    Generic storage layer
                    with ALL table schemas
                            │
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   lab.db     │ │ devpulse.db  │ │  project.db  │
    │              │ │              │ │              │
    │ Lab tables   │ │ Global       │ │ Per-project  │
    │ only         │ │ tables only  │ │ tables only  │
    └──────────────┘ └──────────────┘ └──────────────┘
         │                  │                  │
         │                  │                  │
         ▼                  ▼                  ▼
    Lab binary       Desktop binary    Desktop binary
    (internal)       (global config)   (project data)
```

**Same code. Different files. Complete isolation.**
