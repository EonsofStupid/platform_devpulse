# Banter: Claude Persistent Memory System

> Full implementation plan for SurrealDB-backed conversation persistence

---

## 1. Hooks Integration: Auto-Read on Session Start

### Goal
Automatically query SurrealDB and inject context into Claude on every session start and post-compact.

### Implementation

**File: `~/.claude/hooks/on-session-start.js`**

```javascript
#!/usr/bin/env node
/**
 * Claude Code hook: Runs on session start
 * Queries SurrealDB banter namespace and outputs context for Claude
 */

import Surreal from 'surrealdb';

const SURREAL_URL = process.env.SURREAL_URL || 'ws://127.0.0.1:8000/rpc';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASSWORD || 'root';

async function restoreContext() {
  const db = new Surreal();

  try {
    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: 'banter', database: 'sessions' });

    // Get current context (high priority first)
    const context = await db.query(`
      SELECT key, value FROM context ORDER BY priority DESC LIMIT 10
    `);

    // Get critical learnings
    const learnings = await db.query(`
      SELECT trigger, correct_action FROM learnings
      WHERE severity = 'critical'
    `);

    // Get pending tasks
    const tasks = await db.query(`
      SELECT content, status FROM tasks
      WHERE status IN ['pending', 'in_progress']
      ORDER BY priority DESC LIMIT 10
    `);

    // Get unresolved blockers
    const blockers = await db.query(`
      SELECT description FROM blockers WHERE resolved = false
    `);

    // Output as structured reminder
    console.log('=== BANTER CONTEXT RESTORE ===\n');

    if (context[0]?.result?.length) {
      console.log('## Current Context');
      context[0].result.forEach(c => console.log(`- ${c.key}: ${c.value}`));
      console.log('');
    }

    if (learnings[0]?.result?.length) {
      console.log('## Critical Learnings (DO NOT REPEAT)');
      learnings[0].result.forEach(l =>
        console.log(`- When "${l.trigger}" → ${l.correct_action}`)
      );
      console.log('');
    }

    if (tasks[0]?.result?.length) {
      console.log('## Pending Tasks');
      tasks[0].result.forEach(t =>
        console.log(`- [${t.status}] ${t.content}`)
      );
      console.log('');
    }

    if (blockers[0]?.result?.length) {
      console.log('## Unresolved Blockers');
      blockers[0].result.forEach(b => console.log(`- ${b.description}`));
      console.log('');
    }

    console.log('=== END BANTER CONTEXT ===');

  } catch (err) {
    console.error('Banter restore failed:', err.message);
  } finally {
    await db.close();
  }
}

restoreContext();
```

**Hook Registration: `~/.claude/settings.json`**

```json
{
  "hooks": {
    "session-start": [
      {
        "command": "node ~/.claude/hooks/on-session-start.js",
        "timeout": 5000,
        "inject": "system"
      }
    ],
    "post-compact": [
      {
        "command": "node ~/.claude/hooks/on-session-start.js",
        "timeout": 5000,
        "inject": "system"
      }
    ]
  }
}
```

### Dependencies
- `surrealdb` - Official SurrealDB JavaScript SDK (v1.3.2+)
- Node.js 18+

```bash
npm install surrealdb
# or
pnpm add surrealdb
```

---

## 2. Auto-Write on Tool Use: File Tracking

### Goal
Automatically log file operations to `files_touched` table.

### Implementation

**File: `~/.claude/hooks/on-file-write.js`**

```javascript
#!/usr/bin/env node
/**
 * Claude Code hook: Runs after file write/edit operations
 * Logs to SurrealDB files_touched table
 */

import Surreal from 'surrealdb';

const SESSION_ID = process.env.CLAUDE_SESSION_ID || `session-${new Date().toISOString().split('T')[0]}`;

async function logFileTouch(filePath, action) {
  const db = new Surreal();

  try {
    await db.connect('ws://localhost:8000/rpc');
    await db.signin({ username: 'root', password: 'root' });
    await db.use({ namespace: 'banter', database: 'sessions' });

    await db.query(`
      INSERT INTO files_touched (path, action, session_id) VALUES ($path, $action, $session)
    `, {
      path: filePath,
      action: action,
      session: SESSION_ID
    });

  } catch (err) {
    // Silent fail - don't interrupt Claude workflow
    console.error('Banter file log failed:', err.message);
  } finally {
    await db.close();
  }
}

// Parse args: node on-file-write.js <action> <filepath>
const [,, action, ...pathParts] = process.argv;
const filePath = pathParts.join(' ');

if (action && filePath) {
  logFileTouch(filePath, action);
}
```

**Hook Registration:**

```json
{
  "hooks": {
    "post-tool": {
      "Write": [
        {
          "command": "node ~/.claude/hooks/on-file-write.js created \"$FILE_PATH\"",
          "async": true
        }
      ],
      "Edit": [
        {
          "command": "node ~/.claude/hooks/on-file-write.js modified \"$FILE_PATH\"",
          "async": true
        }
      ],
      "Read": [
        {
          "command": "node ~/.claude/hooks/on-file-write.js read \"$FILE_PATH\"",
          "async": true
        }
      ]
    }
  }
}
```

---

## 3. Commit Skill: `/banter commit`

### Goal
Create a Claude Code skill to save progress with conventional commit style.

### Implementation

**File: `~/.claude/skills/banter-commit.md`**

```markdown
---
name: banter-commit
description: Save progress to SurrealDB with conventional commit format
triggers:
  - /banter commit
  - /bc
---

# Banter Commit Skill

When the user invokes `/banter commit <type>(<scope>): <message>`, execute the following:

## Parse Input

Extract from user input:
- `type`: One of feat, fix, refactor, chore, docs, test, style, perf, breaking, revert
- `scope`: Optional component/area affected
- `message`: Description of what was accomplished
- `body`: Optional detailed explanation (if user provides multi-line)

## Determine Files

List files modified in this session by:
1. Checking recent Edit/Write tool calls
2. Running `git diff --name-only` if in a git repo

## Execute

Use MCP tool (surrealdb-banter) to run:

```sql
INSERT INTO commits (type, scope, message, body, files, session_id) VALUES (
  $type,
  $scope,
  $message,
  $body,
  $files,
  $session
);
```

## Confirm

Output:
```
✓ Banter commit saved: <type>(<scope>): <message>
  Files: <count> tracked
  Session: <session_id>
```

## Examples

User: `/banter commit feat(coldlight): Add panel recipe variants`
→ Saves feat commit with scope "coldlight"

User: `/bc fix: Resolve typed-routes allowlist pattern`
→ Saves fix commit without scope

User: `/banter commit refactor(preflight): Delete broken checks`
→ Saves refactor commit
```

**File: `~/.claude/skills/banter-commit.js`** (executable)

```javascript
#!/usr/bin/env node
/**
 * Banter commit skill executor
 */

import Surreal from 'surrealdb';
import { execSync } from 'child_process';

const SESSION_ID = process.env.CLAUDE_SESSION_ID || `session-${new Date().toISOString().split('T')[0]}`;

async function banterCommit(input) {
  // Parse conventional commit format: type(scope): message
  const match = input.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);

  if (!match) {
    console.error('Invalid format. Use: type(scope): message');
    console.error('Types: feat, fix, refactor, chore, docs, test, style, perf, breaking, revert');
    process.exit(1);
  }

  const [, type, scope, message] = match;

  // Validate type
  const validTypes = ['feat', 'fix', 'refactor', 'chore', 'docs', 'test', 'style', 'perf', 'breaking', 'revert'];
  if (!validTypes.includes(type)) {
    console.error(`Invalid type: ${type}`);
    console.error(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  // Get modified files from git
  let files = [];
  try {
    const gitOutput = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    files = gitOutput.split('\n').filter(Boolean);
  } catch {
    // Not in git repo or no changes
  }

  // Save to SurrealDB
  const db = new Surreal();

  try {
    await db.connect('ws://localhost:8000/rpc');
    await db.signin({ username: 'root', password: 'root' });
    await db.use({ namespace: 'banter', database: 'sessions' });

    await db.query(`
      INSERT INTO commits (type, scope, message, files, session_id) VALUES ($type, $scope, $message, $files, $session)
    `, {
      type,
      scope: scope || null,
      message,
      files,
      session: SESSION_ID
    });

    const scopePart = scope ? `(${scope})` : '';
    console.log(`✓ Banter commit saved: ${type}${scopePart}: ${message}`);
    console.log(`  Files: ${files.length} tracked`);
    console.log(`  Session: ${SESSION_ID}`);

  } catch (err) {
    console.error('Banter commit failed:', err.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Get input from args
const input = process.argv.slice(2).join(' ');
if (!input) {
  console.error('Usage: banter-commit <type>(scope): message');
  process.exit(1);
}

banterCommit(input);
```

---

## 4. Weekly Sync: Archive Script

### Goal
Archive old sessions and keep the database lean.

### Implementation

**File: `scripts/surrealdb/banter-archive.js`**

```javascript
#!/usr/bin/env node
/**
 * Banter weekly archive script
 * Moves old records to archive tables, exports to JSON
 */

import Surreal from 'surrealdb';
import fs from 'fs';
import path from 'path';

const ARCHIVE_DIR = './archives/banter';
const RETENTION_DAYS = 30;

async function archive() {
  const db = new Surreal();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  const cutoff = cutoffDate.toISOString();

  try {
    await db.connect('ws://localhost:8000/rpc');
    await db.signin({ username: 'root', password: 'root' });
    await db.use({ namespace: 'banter', database: 'sessions' });

    console.log(`Archiving records older than ${cutoff}...`);

    // Export old commits
    const oldCommits = await db.query(`
      SELECT * FROM commits WHERE timestamp < $cutoff
    `, { cutoff });

    // Export old files_touched
    const oldFiles = await db.query(`
      SELECT * FROM files_touched WHERE timestamp < $cutoff
    `, { cutoff });

    // Export completed tasks
    const completedTasks = await db.query(`
      SELECT * FROM tasks WHERE status = 'completed' AND updated_at < $cutoff
    `, { cutoff });

    // Export resolved blockers
    const resolvedBlockers = await db.query(`
      SELECT * FROM blockers WHERE resolved = true AND timestamp < $cutoff
    `, { cutoff });

    // Create archive directory
    const archiveDate = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVE_DIR, archiveDate);
    fs.mkdirSync(archivePath, { recursive: true });

    // Write archives
    const archives = {
      commits: oldCommits[0]?.result || [],
      files_touched: oldFiles[0]?.result || [],
      tasks: completedTasks[0]?.result || [],
      blockers: resolvedBlockers[0]?.result || []
    };

    for (const [table, records] of Object.entries(archives)) {
      if (records.length > 0) {
        fs.writeFileSync(
          path.join(archivePath, `${table}.json`),
          JSON.stringify(records, null, 2)
        );
        console.log(`  Archived ${records.length} ${table} records`);
      }
    }

    // Delete archived records
    await db.query(`DELETE FROM commits WHERE timestamp < $cutoff`, { cutoff });
    await db.query(`DELETE FROM files_touched WHERE timestamp < $cutoff`, { cutoff });
    await db.query(`DELETE FROM tasks WHERE status = 'completed' AND updated_at < $cutoff`, { cutoff });
    await db.query(`DELETE FROM blockers WHERE resolved = true AND timestamp < $cutoff`, { cutoff });

    console.log(`\n✓ Archive complete: ${archivePath}`);

    // Stats
    const stats = await db.query(`
      SELECT
        (SELECT count() FROM commits GROUP ALL) as commits,
        (SELECT count() FROM tasks GROUP ALL) as tasks,
        (SELECT count() FROM learnings GROUP ALL) as learnings,
        (SELECT count() FROM files_touched GROUP ALL) as files
    `);

    console.log('\nCurrent DB stats:');
    console.log(`  Commits: ${stats[0]?.result?.[0]?.commits?.[0]?.count || 0}`);
    console.log(`  Tasks: ${stats[0]?.result?.[0]?.tasks?.[0]?.count || 0}`);
    console.log(`  Learnings: ${stats[0]?.result?.[0]?.learnings?.[0]?.count || 0}`);
    console.log(`  Files touched: ${stats[0]?.result?.[0]?.files?.[0]?.count || 0}`);

  } catch (err) {
    console.error('Archive failed:', err.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

archive();
```

**Cron/Scheduled Task:**

```bash
# Add to crontab (runs every Sunday at 3am)
0 3 * * 0 node /path/to/scripts/surrealdb/banter-archive.js >> /var/log/banter-archive.log 2>&1
```

**Windows Task Scheduler:**
- Trigger: Weekly, Sunday 3:00 AM
- Action: `node D:\localdev\platform_devpulse\scripts\surrealdb\banter-archive.js`

---

## 5. Directory Structure

```
~/.claude/
├── hooks/
│   ├── on-session-start.js      # Context restore hook
│   └── on-file-write.js         # File tracking hook
├── skills/
│   ├── banter-commit.md         # Skill definition
│   └── banter-commit.js         # Skill executor
└── settings.json                # Hook registrations

scripts/surrealdb/
├── banter-schema.surql          # Database schema
├── banter-seed.surql            # Initial seed data
├── banter-archive.js            # Weekly archive script
└── BANTER_IMPLEMENTATION_PLAN.md # This file

archives/banter/
└── 2026-02-05/                  # Weekly archives
    ├── commits.json
    ├── files_touched.json
    ├── tasks.json
    └── blockers.json
```

---

## 6. Setup Checklist

### Initial Setup
- [ ] SurrealDB running locally (`surreal start --user root --pass root`)
- [ ] Run `banter-schema.surql` in Surrealist/CLI
- [ ] Run `banter-seed.surql` in Surrealist/CLI
- [ ] Install surrealdb SDK: `pnpm add surrealdb -w`
- [ ] Create `~/.claude/hooks/` directory
- [ ] Copy hook scripts
- [ ] Update `~/.claude/settings.json` with hook registrations
- [ ] Create skill files
- [ ] Restart Claude Code

### Verification
- [ ] `node ~/.claude/hooks/on-session-start.js` outputs context
- [ ] `/banter commit test: verification` saves to DB
- [ ] New session shows context restore

### Maintenance
- [ ] Schedule weekly archive script
- [ ] Monitor DB size monthly
- [ ] Review learnings quarterly (prune outdated ones)

---

## 7. MCP Integration (Alternative to Hooks)

If Claude Code MCP tools are available, the hooks can be replaced with direct MCP calls:

```json
{
  "mcpServers": {
    "surrealdb-banter": {
      "command": "uvx",
      "args": ["surreal-mcp"],
      "env": {
        "SURREAL_URL": "ws://localhost:8000/rpc",
        "SURREAL_USER": "root",
        "SURREAL_PASSWORD": "root",
        "SURREAL_NAMESPACE": "banter",
        "SURREAL_DATABASE": "sessions"
      }
    }
  }
}
```

Then Claude can directly call MCP query tools instead of spawning hook processes.

---

## 8. Future Enhancements

1. **Multi-project support**: Namespace per project, switch context on `cd`
2. **Team sync**: Push learnings to shared cloud SurrealDB instance
3. **Analytics dashboard**: Web UI showing session stats, common blockers
4. **AI-generated summaries**: Weekly digest of commits and learnings
5. **Pattern detection**: Flag when Claude is about to repeat a mistake
