# SPRINT: SurrealDB Standalone Setup

> **Goal:** Get SurrealDB v3 running on the dev machine with proper namespace architecture, seeded with all project knowledge, and connected to Claude via MCP.
> **Priority:** HIGH — unblocks persistent AI memory across sessions
> **Prerequisites:** SurrealDB v3.0.0 installed (DONE — C:\Program Files\SurrealDB\surreal.exe)

---

## Architecture Reference

See: `scripts/surrealdb/ARCHITECTURE.md`

**Three namespaces:**
- `global/knowledge` — shared cross-project knowledge (read-only for agents)
- `projects/devpulse` — project-specific rules, context, decisions
- `agents/claude` — Claude session data, chat logs, file tracking

---

## Phase 1: Start Server + Seed Schemas

### Task 1.1: Create data directory
```bash
mkdir D:\localdev\.surrealdb\data
```

### Task 1.2: Start SurrealDB
Double-click `scripts/surrealdb/start-surreal.bat` OR:
```bash
surreal start --user root --pass root --bind 127.0.0.1:8000 --log info file:D:\localdev\.surrealdb\data
```

### Task 1.3: Seed all schemas
In a second terminal, from `scripts/surrealdb/`:
```bash
cd d:\localdev\platform_devpulse\scripts\surrealdb
seed-all.bat
```

This runs all 6 import steps in order:
1. schema-global.surql (global/knowledge tables)
2. schema-projects.surql (projects/devpulse tables)
3. schema-agents.surql (agents/claude tables)
4. schema-access.surql (users + roles)
5. seed-global.surql (preferences, learnings, patterns)
6. seed-devpulse.surql (architecture rules, context, conventions, decisions)

### Task 1.4: Verify
```bash
surreal sql --endpoint ws://localhost:8000 --username root --password root --namespace global --database knowledge
> SELECT * FROM preferences;
> SELECT * FROM learnings WHERE severity = 'critical';
```

Should return seeded data.

**Checkpoint:** SurrealDB running, all 3 namespaces created, data seeded. STOP and verify.

---

## Phase 2: MCP Connection

### Task 2.1: Update .mcp.json
The MCP config should connect to the running standalone instance. Current config already points to localhost:8000.

Verify `.mcp.json`:
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
    },
    "context7": {
      "command": "npx.cmd",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "ctx7sk-2ee50c50-bb37-44af-ad7c-83a76b874a69"
      }
    }
  }
}
```

### Task 2.2: Restart Claude Code
MCP servers load at session start. Restart required.

### Task 2.3: Test MCP
After restart, Claude should be able to query SurrealDB via MCP tools:
```sql
SELECT * FROM context ORDER BY priority DESC;
SELECT * FROM learnings WHERE severity = 'critical';
SELECT * FROM architecture WHERE layer = 'design';
```

**Checkpoint:** Claude can read/write SurrealDB via MCP. STOP and verify.

---

## Phase 3: Hooks (Context Restore)

### Task 3.1: Create hooks directory
```bash
mkdir -p ~/.claude/hooks
```

### Task 3.2: Write session-start hook
`~/.claude/hooks/on-session-start.js` — queries global + projects + agents, outputs structured context for Claude on every session start and post-compact.

Dependencies:
```bash
npm install -g surrealdb
```

### Task 3.3: Register hooks
Update `~/.claude/settings.json`:
```json
{
  "hooks": {
    "session-start": [{
      "command": "node ~/.claude/hooks/on-session-start.js",
      "timeout": 5000,
      "inject": "system"
    }],
    "post-compact": [{
      "command": "node ~/.claude/hooks/on-session-start.js",
      "timeout": 5000,
      "inject": "system"
    }]
  }
}
```

### Task 3.4: Write file-tracking hook
`~/.claude/hooks/on-file-write.js` — logs file operations to agents/claude/files_touched.

### Task 3.5: Test hooks
- Start new session → should see context restore output
- Edit a file → should log to files_touched

**Checkpoint:** Hooks working. Context auto-restores. Files auto-tracked.

---

## Phase 4: Banter Commit Skill

### Task 4.1: Create skill files
- `~/.claude/skills/banter-commit.md` (skill definition)
- `~/.claude/skills/banter-commit.js` (executor)

### Task 4.2: Test skill
```
/banter commit feat(surrealdb): Set up standalone instance with v3 architecture
```

Should save to projects/devpulse/commits.

---

## Phase 5: Archive Script

### Task 5.1: Write archive.js
`scripts/surrealdb/archive.js` — moves records older than 30 days to JSON exports.

### Task 5.2: Schedule
Windows Task Scheduler: weekly, Sunday 3:00 AM.

---

## Verification Checklist

- [ ] SurrealDB v3 running on localhost:8000 with persistent file storage
- [ ] Three namespaces created: global, projects, agents
- [ ] Global knowledge seeded (preferences, learnings, patterns)
- [ ] DevPulse project data seeded (architecture, context, decisions, conventions)
- [ ] Claude agent DB created (sessions, chat, files_touched, blockers)
- [ ] Access control users defined (agent_reader, claude)
- [ ] MCP connected — Claude can query SurrealDB
- [ ] Session-start hook restores context automatically
- [ ] File-write hook tracks operations
- [ ] /banter commit skill saves progress
- [ ] start-surreal.bat double-click launches server
- [ ] seed-all.bat provisions from scratch

---

## Files Created

```
scripts/surrealdb/
├── ARCHITECTURE.md          # Full architecture documentation
├── schema-global.surql      # NS: global / DB: knowledge
├── schema-projects.surql    # NS: projects / DB: devpulse
├── schema-agents.surql      # NS: agents / DB: claude
├── schema-access.surql      # Users, roles, permissions
├── seed-global.surql        # Preferences, learnings, patterns
├── seed-devpulse.surql      # DevPulse arch rules, context, decisions
├── start-surreal.bat        # Double-click launcher
└── seed-all.bat             # Seed everything in order
```

---

## Execution Order

1. Phase 1 first (server + schemas) — MUST complete before anything else
2. Phase 2 (MCP) — requires server running
3. Phase 3 (hooks) — requires MCP working
4. Phase 4 (skill) — requires hooks working
5. Phase 5 (archive) — can be done anytime after Phase 1
