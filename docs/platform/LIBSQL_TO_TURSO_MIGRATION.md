# LibSQL → Turso Migration Spec

> Authored 2026-06-29, after the ClyffyOS extraction Phase 0–3c landed.
> Predecessor planning artifact: held workflow `wg4az7jvm` (the libsql→
> turso draft that the operator paused pre-extraction).
> Anchor commit on `platform_devpulse`: `d8bc4f3d`.

---

## 1. Why now

The kernel-extraction charter ([.claude/charters/kernel-extraction.md])
splits the workspace at the IP boundary: DevPulse becomes a thin shell
with its own local store; ClyffyOS becomes the headless inference + persona
backend. The current relational store is one libsql workspace under
`.userdata/{system,user}/libsql/`, schema-applied at boot by the engine
(`systems/devpulse-engine/src/platform/services/relational.rs:75` and `:167`).
Both schemas — `SYSTEM_SCHEMA` and `USER_SCHEMA` — were authored under the
assumption that DevPulse and the kernel live in one process.

After the Phase 5 cut they DON'T. The relational store has to split.

This spec covers the split decision, the migration path for the 692 KB of
live data already on disk, and the wire shape that lets DevPulse's local
Turso sync forward to a remote and ClyffyOS pull via embedded-replica.

## 2. Current data inventory (verified 2026-06-29)

| File | Size | Schema source | Tables (sampled) |
|---|---:|---|---|
| `.userdata/system/libsql/platform.db` | 84 KB | `SYSTEM_SCHEMA` (engine) | `kv_store`, `platform_config`, `guardian_states`, `boot_history`, `grammar_service`, `grammar_defaults`, `grammar_baselines` |
| `.userdata/user/libsql/user.db` | 608 KB | `USER_SCHEMA` (engine) | `profiles`, `preferences`, `api_keys`, `projects`, `sessions`, `turns`, `anchors`, `open_loops`, `focus_contexts`, `corrections`, `learnings`, `user_concepts`, `psych_states`, `ambient_observations`, `decisions`, `decision_factors`, `translation_memory`, `attunement_preferences`, `attunement_learned`, `model_registry`, `grammar_schemas`, `grammar_bindings`, `golden_path`, `project_references`, `project_context`, `grammar_preferences`, `user_config`, `kv_store` (~28 tables) |
| `.userdata/_archive-20260519T151101/...` | — | (frozen) | Archived May 19 snapshot. Out of scope. Do not migrate. |
| `persona_blocks` + `persona_idempotency` | (in `user.db`? schema authored by persona-mcp; see open question OQ-3) | `clyffyos-persona-mcp/src/schema.rs:PERSONA_SCHEMA` | `persona_blocks`, `persona_idempotency` |

Per-project SurrealQL (NOT migrating to Turso — stays on SurrealDB):
- `clyffyos-connectome/src/connectome/intelligence/schema.rs:MEMORY_SCHEMA` — HNSW
  embeddings + RRO archive, per-project namespace. SurrealDB-locked.

## 3. The split

| Concern | Destination | Why |
|---|---|---|
| User identity / preferences / settings (`profiles`, `preferences`, `api_keys`, `user_config`, `grammar_preferences`) | **DevPulse Turso** | UI state. Belongs to the user's local-first store. |
| Projects + project metadata (`projects`, `project_references`, `project_context`, `golden_path`, `grammar_schemas`, `grammar_bindings`) | **DevPulse Turso** | Project list IS the DevPulse home screen. Local-first. |
| Conversations (`sessions`, `turns`, `anchors`, `open_loops`, `focus_contexts`) | **DevPulse Turso** | Per the charter: "DevPulse = VSCode, but with a DB tied to it — projects, old conversations (RRO), stats." |
| Stats / learning / mastery (`user_concepts`, `psych_states`, `ambient_observations`, `decisions`, `decision_factors`, `translation_memory`, `attunement_*`, `corrections`, `learnings`) | **DevPulse Turso** | Per-user behavioral data. Local-first; Clyffy pulls via sync when reasoning needs it. |
| Model registry / hardware state (`model_registry`) | **DevPulse Turso** (read-only mirror on ClyffyOS) | Operator-owned config. ClyffyOS reads to know what's installed. |
| Platform internals (`SYSTEM_SCHEMA` — `platform_config`, `guardian_states`, `boot_history`, `grammar_service`, `grammar_defaults`, `grammar_baselines`, `kv_store`) | **ClyffyOS local libsql** (renamed/kept) | Engine boot state. Belongs with the daemon. |
| Persona blocks (`persona_blocks`, `persona_idempotency`) | **ClyffyOS local libsql** | Letta-style core memory. Per `clyffyos-persona-mcp` charter. Server-owned. |
| Per-project memory (HNSW + RRO archive) | **ClyffyOS SurrealDB** | Already SurrealQL. Not affected. |

**Net (first draft):** USER_SCHEMA → DevPulse Turso (the entire `user.db`).
SYSTEM_SCHEMA stays as a libsql file in clyffyos data dir. Persona-MCP
schema stays as a libsql file in clyffyos data dir.

> See §3.5 — this first-draft split is REVISED to comply with a locked
> SurrealDB decision row.

---

## 3.5 Reconciliation with `decisions:sw2wunt00tcgk6l8brm7`

The agent-memory SurrealDB (queryable at
`https://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud`,
NS=`projects`, DB=`devpulse` — see [[reference-surrealdb-active-use]])
carries a sprint-00 decision row that this draft initially missed:

> **"DuckDB and libSQL per-project, SurrealDB global"**
> — `decisions:sw2wunt00tcgk6l8brm7`, 2026-05-09
> Decision: DuckDB analytical store and libSQL relational store: fresh
> per project. SurrealDB: ONE global instance (kv-surrealkv embedded),
> persona namespaces span projects.
> Reasoning: Per-project isolation for clean teardown + analytics
> partition. Global SurrealDB for cross-project persona/knowledge that
> should persist.

The first-draft proposal in §3 bundles the entire 28-table USER_SCHEMA
into one DevPulse-local Turso replica. That violates the per-project
libsql rule for tables that carry a `project_id` foreign key.

### 3.5.1 The correct split, three buckets

| Bucket | Where it goes | Tables (from USER_SCHEMA) |
|---|---|---|
| **User scope** — cross-project, identity + preferences + the project registry itself | **DevPulse Turso** (one replica, syncs to remote) | `profiles`, `preferences`, `grammar_preferences`, `api_keys`, `user_config`, **`projects`** (the registry — list of every project the user has touched), `model_registry`, `user_concepts`, `attunement_preferences`, `attunement_learned`, `translation_memory`, `kv_store` |
| **Project scope** — state that exists ONLY in the context of one project | **Per-project libsql file** (one DB per project, e.g. `.userdata/projects/{project_id}/state.db`) | `golden_path`, `project_references`, `project_context`, `grammar_schemas`, `grammar_bindings`, `sessions`, `turns`, `anchors`, `open_loops`, `focus_contexts`, `psych_states`, `ambient_observations`, `corrections`, `learnings`, `decisions` (USER_SCHEMA's), `decision_factors` |
| **Persona / cross-project knowledge** | **Clyffy-embedded SurrealDB** (per the existing arch rule "TWO SurrealDB instances: embedded (Clyffy) + standalone (agent memory). Zero shared data.") | `persona_blocks`, `persona_idempotency` (already from `clyffyos-persona-mcp`) — NO change from current. |

Test for which bucket a USER_SCHEMA row belongs in:

1. Does the row have a non-null `project_id` (or transitively via `session_id`)? → **Project scope**, per-project libsql.
2. Is it user-identity / projects-registry / user-wide preference / cross-project learning? → **User scope**, DevPulse Turso.
3. Is it Letta-style persona block / memory the persona MCP serves? → **Persona scope**, clyffy-embedded SurrealDB.

### 3.5.2 Why this is correct, not pedantic

- **Clean per-project teardown.** Delete a project = drop its `state.db`
  file. No FK cascade gymnastics against a giant shared store.
- **Project-scope analytics partition.** Sprint-00 reasoning verbatim:
  "analytics partition." DuckDB analytics already shipped per-project;
  per-project libsql matches.
- **Smaller Turso sync surface.** The cross-project user data is small
  (probably <100 KB after migration). Per-project rows (sessions/turns
  may grow into MB) stay local and never sync — matches the charter's
  "DevPulse Turso ↔ Clyffy bridge" (only what's worth bridging crosses).
- **clyffyd embedded-replica gets only what it needs.** Reading "what
  models does the user have" (model_registry) + "what's the user's
  current style preferences" (preferences) — those sync. Per-project
  conversation history doesn't (clyffyd reasons against the live
  session, not historical turns).

### 3.5.3 What changes in the migration procedure (§6)

Phase B (data dump) splits into two passes:
- **B-user.json** — dump the 12 user-scope tables (per §3.5.1) for direct
  import into DevPulse Turso.
- **B-per-project.json** (one file per distinct project_id appearing in
  any project-scope table) — dump each project's slice into its own
  JSON. The project_id list comes from `SELECT id FROM projects`.

Phase C (import) splits:
- **C-user** — apply user-scope DDL to Turso, import `B-user.json`.
- **C-per-project** — for each project_id, create
  `.userdata/projects/{project_id}/state.db`, apply the per-project DDL
  subset, import `B-per-project-{project_id}.json`.

Phase D (rewrite reads) — DevPulse-side adapter routes a read to:
- DevPulse Turso if the table is user-scope
- The active project's libsql file if it's project-scope

The `project_id` must be in the read call's context (already true today —
the engine has `ProjectInit::active_project()`).

### 3.5.4 What this does NOT change

- The §4 crate decision (stay on `libsql`) — same crate handles both the
  Turso embedded-replica AND the per-project files.
- The §5 schema portability — DDL ports verbatim either way.
- The §8 wire shape — DevPulse Turso ↔ remote ↔ clyffyd replica is
  unchanged. The per-project files are LOCAL ONLY; they never sync.
- The §9 token discipline — applies to Turso credentials; per-project
  files are local-on-disk.

### 3.5.5 Open question carried forward

Add to §10:

| # | Question | Default |
|---|---|---|
| OQ-6 | Should the per-project libsql files also publish a redacted slice (project_id only — "this user worked on project X") into DevPulse Turso so clyffyd can know what projects exist without seeing their contents? | Yes — write a `project_id_visibility` table to Turso with just `(project_id, last_active_at)`. clyffyd reads this to know the project list; reads detailed state only when the user routes a query through DevPulse. |



## 4. Crate decision: `libsql` vs `turso`/Limbo

| Property | `libsql` | `turso` (Limbo) |
|---|---|---|
| API | sqlite3-compatible, async | sqlite3-compatible, sync core + async wrapper |
| Embedded-replica sync (one-way pull from remote) | ✅ — first-class | ❌ — local-only |
| Pure Rust, zero C deps | ❌ — vendored C SQLite | ✅ |
| Maturity (2026-06) | stable, prod-deployed | beta, evolving |
| Tracing integration in this workspace | already wired via `LibSqlAdapter` | would need re-author |
| Workspace pin | `libsql = "0.9"` (workspace.dependencies) | — |

**DECISION (operator, 2026-07-01): replace the `libsql` crate with the `turso`
crate everywhere.** This supersedes the earlier "stay on libsql" recommendation.

The blocking reason that recommendation gave — that `turso`/Limbo lacked
embedded-replica sync — is **no longer true** (verified against current Turso
docs 2026-07-01). The `turso` crate (**0.4.3** stable; `turso::sync`, Offline
Sync public beta) does local reads+writes with explicit `push()` / `pull()`
change-data-capture sync. That satisfies the charter's "DevPulse Turso ↔ Clyffy
bridge" ([[turso-clyffy-bridge]]): DevPulse writes locally and `push()`es to the
remote; clyffyd `pull()`s a read-only replica. **The sync bridge survives the swap.**

- **Crate:** `turso = "0.4.3"` (workspace pin) replaces `libsql = "0.9"`. Pure
  Rust, zero vendored C. Native **vector search** — folds the "vector seed for
  Turso" goal into the same store rather than a separate engine.
- **API mapping:** `libsql::Builder::new_local` → `turso::Builder::new_local`;
  `libsql::Connection` → `turso::Connection`; `libsql::{Value,Row}` →
  `turso::{Value,Row}`; `row.get::<T>(i)` supported verbatim; `libsql::params!`
  → turso's params utilities (heterogeneous named + positional).
- **Sync:** `turso::sync::Builder` (`new_remote` / `with_remote_url` /
  `with_auth_token` / `bootstrap_if_empty`) drives the DevPulse↔remote↔clyffyd
  bridge (§8); token via keyring SSOT (§9), never hardcoded.

The migration is a direct crate + idiom swap across the current `libsql` call
sites. Both the DevPulse embedded replica and the per-project files use `turso`.

## 5. Schema portability

Both SYSTEM_SCHEMA and USER_SCHEMA use SQLite-compatible DDL with
`unixepoch()`, `(unixepoch())` default expressions, `TEXT/BLOB/INTEGER/REAL`
types, `CHECK(scope IN (...))` constraints, and `REFERENCES ... ON DELETE
CASCADE` foreign keys. Turso speaks the same dialect (it IS libsql).

Validated compatibility:
- `unixepoch()` — libsql/Turso ✅
- JSON columns (stored as TEXT) — ✅
- BLOB — ✅
- Composite UNIQUE constraints — ✅
- Foreign keys ON DELETE CASCADE — ✅

**No DDL changes needed.** The schemas port verbatim.

## 6. Migration procedure (the actual steps)

Assumes ClyffyOS has its own libsql data dir wired (let's call it
`{clyffyos_data_dir}/system/libsql/` and `.../persona/libsql/`). DevPulse
has a new Turso target. Both repos compile clean today.

### 6.1 Phase A — DevPulse: set up the local Turso

1. Author a new DevPulse-side adapter at
   `interfaces/desktop/src-tauri/src/storage/turso.rs` (post-Phase-5 home).
   It wraps `libsql::Builder::new_remote_replica(local_path, remote_url, token)`
   so:
   - Reads hit the local replica (zero-network latency).
   - Writes go to local + sync to remote.
   - On boot, replica pulls fresh state from remote.
2. Pick the remote target. Options:
   - **Turso Cloud** (managed). Free tier covers 608 KB easily. Token
     stored via the existing OS-keyring SSOT (`devpulse:turso-cloud`).
     Recommended for first iteration.
   - **Self-hosted libsql-server** on the user's GB10. Same `libsql`
     replica protocol, just a different URL.
3. Create the remote DB; apply USER_SCHEMA to it once.

### 6.2 Phase B — Data dump from current `user.db`

1. Author a one-shot `xtask user-db-export` subcommand that opens
   `.userdata/user/libsql/user.db` read-only, walks every table in
   USER_SCHEMA, and writes a portable JSON dump to stdout.
2. Schema-driven enumeration (read `sqlite_master`) so adding a future
   table doesn't require updating the dump tool.
3. Validate: dump → import into a throwaway Turso DB → row counts match.

### 6.3 Phase C — Import into Turso

1. `xtask user-db-import <turso-url> <token> <dump.json>` — applies
   USER_SCHEMA, then INSERTs every row preserving primary keys.
2. Verify foreign-key integrity (no orphaned `turns.session_id` etc.).
3. Verify timestamps are preserved (the `unixepoch()` defaults only fire
   on NULL insert; the dump must send explicit values).

### 6.4 Phase D — DevPulse rewrite reads from Turso

1. In the post-Phase-5 DevPulse rewrite, replace the engine's relational
   read paths with calls into the new local-replica adapter.
2. Local cache hot-path: zero round-trip — the replica is on-disk.
3. Foreground sync on app focus; background sync every 60s.

### 6.5 Phase E — ClyffyOS pulls a read-only slice

1. clyffyd configures its own embedded-replica against the SAME remote
   Turso URL with a least-privilege token (read-only on the tables the
   daemon needs — `projects`, `model_registry`, `attunement_*`, etc.).
2. Per the charter: "DevPulse-local Turso gets a designed least-privilege
   service account (creds via keyring SSOT)." The token is provisioned on
   the Turso side, NEVER hardcoded.
3. clyffyd's reasoning pipeline reads project context / preferences from
   its local replica — no cross-process RPC.

### 6.6 Phase F — ClyffyOS persona + system libsql

1. ClyffyOS's own kernel state lives in a separate libsql file in
   `{clyffyos_data_dir}/`. NOT Turso. Reasons:
   - Pure-server data (boot history, grammar service state) doesn't need
     sync.
   - Keeps the wire surface small — only the user's behavioral data
     crosses the sync.
2. SYSTEM_SCHEMA + PERSONA_SCHEMA apply at clyffyd boot via the existing
   `LibSqlAdapter::open_with_schema`. No code changes beyond wiring the
   new path.

## 7. The 84 KB platform.db migration (separate from user.db)

`.userdata/system/libsql/platform.db` was written by the in-process engine
during DevPulse-monolith era. After the cut, this data is ClyffyOS-side.
Either:

- **Discard** — the data is platform-internal state (boot history,
  grammar baselines). The new clyffyd boots fresh on first run and
  rebuilds.
- **Carry forward** — copy `platform.db` to
  `{clyffyos_data_dir}/system/libsql/platform.db` and clyffyd opens it
  in place.

**Recommendation:** carry forward IF the dev box has meaningful baselines
captured (grammar_baselines, learnings); discard otherwise. The decision
is operator-owned because the platform.db on this box may carry inside-
references to historical state worth keeping. Surface during Phase E.

## 8. Wire shape: the bridge

Per `[[turso-clyffy-bridge]]` (charter §"Data bridge"):

```
┌────────────────┐    sync     ┌──────────────┐    embedded-replica    ┌──────────────┐
│ DevPulse local │ ──────────► │  Turso Cloud │ ◄────────────────────  │ clyffyd      │
│ Turso replica  │             │  (remote)    │                        │ Turso replica│
│ (writable)     │             │              │                        │ (read-only)  │
└────────────────┘             └──────────────┘                        └──────────────┘
```

- DevPulse writes locally; sync publishes deltas to the remote.
- clyffyd pulls deltas via embedded-replica. Its writes are blocked at the
  token-permission level (least-privilege).
- Conflict resolution: not needed in v1 — only DevPulse writes the user
  data. clyffyd writes its own state in a separate libsql file.

## 9. Token + secret discipline

- DevPulse-side Turso write token: stored in OS keyring,
  service `devpulse:turso-cloud`, account `dev-write`.
- clyffyd-side read token: stored in clyffyd's secrets channel (TBD —
  per [[secrets-keyring-ssot]] convention but the daemon's secret store
  is its own decision; surface to operator).
- NEVER hardcode the token. NEVER commit it. Per
  [[USE-INFISICAL-FOR-GHA-SECRETS]] if CI ever needs it.

## 10. Open questions (operator decisions)

| # | Question | Default recommendation |
|---|---|---|
| OQ-1 | Turso Cloud or self-hosted libsql-server (e.g. on GB10)? | Cloud first (free tier covers 608 KB); migrate to self-host on GB10 when GB10 onlining lands. Same protocol, drop-in change. |
| OQ-2 | Carry `platform.db` (84 KB) forward to clyffyd, or fresh init? | Surface during Phase E. Likely carry — has dev-history grammar baselines. |
| OQ-3 | Where does `persona_blocks` actually live today? `user.db` (per schema co-location) or its own file? | Verify with a sqlite3 probe in Phase B; the migration treats it as clyffyos-side regardless. |
| OQ-4 | Embedded-replica sync interval — 60s default OK for clyffyd, or shorter? | 60s. The user-visible writes (preferences, project edits) round-trip via DevPulse-write → cloud → clyffyd-pull; clyffyd never sees stale data more than ~1 minute. |
| OQ-5 | What happens to the existing 608 KB user.db after migration? | Archive into `.userdata/_archive-<timestamp>/` (matches the 2026-05-19 archive pattern). Don't delete until Phase F is verified green. |

## 11. Risk + rollback

| Risk | Mitigation |
|---|---|
| Turso remote unavailable at boot | Local replica is the read source-of-truth. Sync is best-effort. App functional offline. |
| Schema drift between DevPulse + clyffyd | One DDL source (USER_SCHEMA), one remote DB. Both replicas pull the same DDL. CI test compares effective DDL. |
| Network token leak | Keyring-only; never `gh secret set` raw (per [[USE-INFISICAL-FOR-GHA-SECRETS]]). Use Infisical to provision the dev box's keyring at first run. |
| Data loss during dump → import | Atomic: dump JSON → import → verify row counts → only then rename `user.db` to archive. Two-phase commit. |

Rollback at every phase: keep the original `.userdata/user/libsql/user.db`
intact until Phase F verifies green. If Turso path fails, point DevPulse
back at the libsql file and ship it.

## 12. What this spec does NOT cover

- The actual clyffyd binary shape (operator-led).
- The DevPulse wizard rewrite (post-Phase-5 work).
- The teleautomaton chat UI (separate scope —
  [[project-devpulse-onboarding-to-costar-brainstorm]]).
- The GB10 connection-mode picker (gb10-wizard-flip plan).
- SurrealDB / per-project intelligence migration (none needed; stays
  put).

## 13. Related

- `.claude/charters/kernel-extraction.md` §"Data bridge"
- `.claude/plans/clyffyos-extraction.md` — extraction phase plan
- `.claude/plans/gb10-wizard-flip.md` — DevPulse-side rewrite
- `[[turso-clyffy-bridge]]` memory entry
- `[[per-project-vs-global-stores]]` memory entry
- `[[project-devpulse-data-collector-gb10-inference]]` memory entry
- `systems/devpulse-engine/src/platform/services/relational.rs:75,167`
  — current SYSTEM_SCHEMA + USER_SCHEMA source
- `clyffyos-persona-mcp/src/schema.rs` — PERSONA_SCHEMA source
- `clyffyos-connectome/src/connectome/intelligence/schema.rs` — SurrealQL
  MEMORY_SCHEMA (unaffected)
