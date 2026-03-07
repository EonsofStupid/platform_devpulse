#!/usr/bin/env node
// restore-memory.js - Queries SurrealDB to restore context after /compact
// Output goes directly to Claude's context via SessionStart hook
//
// Queries 3 namespaces:
//   global/knowledge  — preferences, critical learnings
//   projects/devpulse — context, pending tasks, architecture rules
//   agents/claude     — recent sessions, unresolved blockers

const { spawnSync } = require("child_process");

const ENDPOINT = "http://127.0.0.1:8822";
const USER = "root";
const PASS = "root";

function query(ns, db, sql) {
	try {
		const result = spawnSync(
			"surreal",
			[
				"sql",
				"--endpoint", ENDPOINT,
				"--namespace", ns,
				"--database", db,
				"--username", USER,
				"--password", PASS,
				"--hide-welcome",
				"--json",
			],
			{
				input: sql,
				encoding: "utf-8",
				timeout: 10000,
			},
		);
		if (result.error || result.status !== 0) return [];
		const parsed = JSON.parse(result.stdout);
		return parsed[0] || [];
	} catch (e) {
		return [];
	}
}

// Check if SurrealDB is accessible
const testResult = query("projects", "devpulse", "SELECT count() AS c FROM context GROUP ALL;");
if (testResult.length === 0) {
	console.log("[SurrealDB not accessible - skipping memory restore]");
	process.exit(0);
}

console.log("## RESTORED CONTEXT FROM SURREALDB\n");

// ── projects/devpulse: Current Context ──
console.log("### Current Context");
const context = query(
	"projects", "devpulse",
	"SELECT key, value, priority FROM context ORDER BY priority DESC LIMIT 10;",
);
for (const row of context) {
	if (row.key && row.value) {
		console.log(`- **${row.key}**: ${row.value}`);
	}
}
console.log("");

// ── global/knowledge: Critical Learnings ──
console.log("### Critical Learnings (DO NOT REPEAT THESE MISTAKES)");
const learnings = query(
	"global", "knowledge",
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

// ── projects/devpulse: Pending Tasks ──
console.log("### Pending Tasks");
const tasks = query(
	"projects", "devpulse",
	"SELECT content, priority, status FROM tasks WHERE status IN ['pending', 'in_progress'] ORDER BY priority DESC;",
);
for (const row of tasks) {
	if (row.content) {
		console.log(`- [${row.status}] ${row.content} (priority: ${row.priority})`);
	}
}
console.log("");

// ── agents/claude: Unresolved Blockers ──
console.log("### Unresolved Blockers");
const blockers = query(
	"agents", "claude",
	"SELECT category, description FROM blockers WHERE resolved = false;",
);
for (const row of blockers) {
	if (row.description) {
		console.log(`- [${row.category}] ${row.description}`);
	}
}
console.log("");

// ── agents/claude: Recent Sessions ──
console.log("### Recent Sessions");
const sessions = query(
	"agents", "claude",
	"SELECT session_id, project, summary, started_at FROM sessions ORDER BY started_at DESC LIMIT 3;",
);
for (const row of sessions) {
	if (row.session_id) {
		const summary = row.summary || "(no summary)";
		console.log(`- ${row.started_at || "?"} — ${summary}`);
	}
}
console.log("");

// ── global/knowledge: Key Preferences ──
console.log("### Preferences");
const prefs = query(
	"global", "knowledge",
	"SELECT category, key, value FROM preferences ORDER BY category LIMIT 10;",
);
for (const row of prefs) {
	if (row.key && row.value) {
		console.log(`- [${row.category}] ${row.key}: ${row.value}`);
	}
}
console.log("");

process.exit(0);
