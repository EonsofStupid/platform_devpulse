#!/usr/bin/env node
// restore-memory.js - Queries SurrealDB after /compact to restore context
// Output goes directly to Claude's context via SessionStart hook

const { spawnSync } = require("child_process");

function query(sql) {
	try {
		const result = spawnSync(
			"surreal",
			[
				"sql",
				"--endpoint",
				"http://127.0.0.1:8000",
				"--namespace",
				"banter",
				"--database",
				"sessions",
				"--username",
				"root",
				"--password",
				"root",
				"--hide-welcome",
				"--json",
			],
			{
				input: sql,
				encoding: "utf-8",
				timeout: 10000,
			},
		);
		if (result.error || result.status !== 0) {
			return [];
		}
		const parsed = JSON.parse(result.stdout);
		// surreal sql --json returns [[rows]] format
		return parsed[0] || [];
	} catch (e) {
		return [];
	}
}

// Check if SurrealDB is accessible
const testResult = query("SELECT count() AS c FROM context GROUP ALL;");
if (testResult.length === 0) {
	console.log("[SurrealDB not accessible - skipping memory restore]");
	process.exit(0);
}

console.log("## RESTORED CONTEXT FROM SURREALDB\n");

// Current context
console.log("### Current Context");
const context = query(
	"SELECT key, value, priority FROM context ORDER BY priority DESC LIMIT 10;",
);
for (const row of context) {
	if (row.key && row.value) {
		console.log(`- **${row.key}**: ${row.value}`);
	}
}
console.log("");

// Critical learnings
console.log("### Critical Learnings (DO NOT REPEAT THESE MISTAKES)");
const learnings = query(
	"SELECT trigger, wrong_action, correct_action FROM learnings WHERE severity = 'critical';",
);
const seen = new Set();
for (const row of learnings) {
	if (!row.trigger) continue;
	if (seen.has(row.trigger)) continue;
	seen.add(row.trigger);
	console.log(`- When: ${row.trigger}`);
	console.log(`  - WRONG: ${row.wrong_action}`);
	console.log(`  - CORRECT: ${row.correct_action}`);
}
console.log("");

// Pending tasks
console.log("### Pending Tasks");
const tasks = query(
	"SELECT content, priority, status FROM tasks WHERE status IN ['pending', 'in_progress'] ORDER BY priority DESC;",
);
for (const row of tasks) {
	if (row.content) {
		console.log(`- [${row.status}] ${row.content} (priority: ${row.priority})`);
	}
}
console.log("");

// Unresolved blockers
console.log("### Unresolved Blockers");
const blockers = query(
	"SELECT category, description FROM blockers WHERE resolved = false;",
);
for (const row of blockers) {
	if (row.description) {
		console.log(`- [${row.category}] ${row.description}`);
	}
}
console.log("");

process.exit(0);
