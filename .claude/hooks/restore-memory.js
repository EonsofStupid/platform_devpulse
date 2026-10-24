#!/usr/bin/env node
// restore-memory.js — SessionStart hook
//
// Creates or restores an `agents/claude` session row and dumps a context
// brief to stdout (Claude reads it as additional system context).
//
// SurrealDB: probes local 8842 first, falls back to cloud, via the
// shared _surreal.js library. All endpoint / credential / header
// constants live in _surreal.js — never redefine them here.
//
// Authority: docs/platform/CLOUD_PREFLIGHT.md is canon. If anything
// drifts from that doc, fix the artifact, not the doc.

const fs = require("node:fs");
const surreal = require("./_surreal.js");

// Read hook input from stdin for CLAUDE_ENV_FILE
let hookData = {};
try {
	const input = fs.readFileSync(0, "utf-8");
	hookData = JSON.parse(input);
} catch {
	// no stdin or invalid JSON — non-fatal
}

// Pick an endpoint by probing a known-existing route.
// `agents/claude` always has the sessions table after the first run.
const endpoint = surreal.probe("agents", "claude");
if (!endpoint) {
	console.log("[Banter: SurrealDB unreachable — local 8842 down, cloud unreachable. Skipping memory restore.]");
	process.exit(0);
}

// Bootstrap every namespace this hook touches. Cloud rejects writes
// to undefined NS/DB with the misleading "read only transaction" error.
surreal.bootstrap(endpoint, "agents", "claude");
surreal.bootstrap(endpoint, "projects", "devpulse");
surreal.bootstrap(endpoint, "global", "knowledge");
surreal.bootstrap(endpoint, "platform_devpulse", "chat");

// Heartbeat — defeats the SurrealDB Cloud free-tier 7-day auto-pause
// on every session start. See CLOUD_PREFLIGHT.md.
surreal.heartbeat(endpoint, "restore-memory");

function query(ns, db, sql) {
	const response = surreal.exec(endpoint, ns, db, sql);
	return surreal.firstResult(response);
}

// ── Create or find active session ────────────────────────────────
const cwd = hookData.cwd || process.cwd();

let sessionRecordId = null;
let sessionId = null;

const active = query("agents", "claude",
	"SELECT * FROM sessions WHERE ended_at = NONE ORDER BY started_at DESC LIMIT 1;");

if (active.length > 0 && active[0].id) {
	sessionRecordId = active[0].id;
	sessionId = active[0].session_id;
} else {
	const created = query("agents", "claude",
		`CREATE sessions SET session_id = <string> rand::uuid(), project = ${surreal.sqlString(cwd)}, started_at = time::now(), message_count = 0;`);
	if (created.length > 0 && created[0].id) {
		sessionRecordId = created[0].id;
		sessionId = created[0].session_id;
	}
}

// Write session id to CLAUDE_ENV_FILE so other hooks can use it
if (sessionRecordId && hookData.env_file) {
	try {
		let envContent = "";
		try {
			envContent = fs.readFileSync(hookData.env_file, "utf-8");
		} catch {
			// file may not exist yet
		}
		envContent = envContent
			.split("\n")
			.filter((l) => !l.startsWith("SURREAL_SESSION_RECORD_ID=") && !l.startsWith("SURREAL_SESSION_ID="))
			.join("\n");
		envContent = envContent.trim();
		if (envContent) envContent += "\n";
		envContent += `SURREAL_SESSION_RECORD_ID=${sessionRecordId}\n`;
		envContent += `SURREAL_SESSION_ID=${sessionId}\n`;
		fs.writeFileSync(hookData.env_file, envContent);
	} catch {
		// env file write failed — non-fatal
	}
}

// ── Brief output ─────────────────────────────────────────────────
console.log("## RESTORED CONTEXT FROM SURREALDB\n");

if (sessionRecordId) {
	console.log(`**Active Session**: \`${sessionId}\` (record: \`${sessionRecordId}\`)\n`);
}

console.log("### Current Context");
for (const row of query("projects", "devpulse",
	"SELECT key, value, priority FROM context ORDER BY priority DESC LIMIT 10;")) {
	if (row.key && row.value) console.log(`- **${row.key}**: ${row.value}`);
}
console.log("");

console.log("### Critical Learnings (DO NOT REPEAT THESE MISTAKES)");
const seen = new Set();
for (const row of query("global", "knowledge",
	"SELECT trigger, wrong_action, correct_action FROM learnings WHERE severity = 'critical';")) {
	if (!row.trigger || seen.has(row.trigger)) continue;
	seen.add(row.trigger);
	console.log(`- When: ${row.trigger}`);
	console.log(`  - WRONG: ${row.wrong_action}`);
	console.log(`  - CORRECT: ${row.correct_action}`);
}
console.log("");

console.log("### Pending Tasks");
for (const row of query("projects", "devpulse",
	"SELECT content, priority, status FROM tasks WHERE status IN ['pending', 'in_progress'] ORDER BY priority DESC;")) {
	if (row.content) console.log(`- [${row.status}] ${row.content} (priority: ${row.priority})`);
}
console.log("");

console.log("### Unresolved Blockers");
for (const row of query("agents", "claude",
	"SELECT category, description FROM blockers WHERE resolved = false;")) {
	if (row.description) console.log(`- [${row.category}] ${row.description}`);
}
console.log("");

console.log("### Recent Sessions");
for (const row of query("agents", "claude",
	"SELECT session_id, project, summary, started_at, ended_at, message_count FROM sessions ORDER BY started_at DESC LIMIT 5;")) {
	if (row.session_id) {
		const summary = row.summary || "(no summary)";
		const status = row.ended_at ? "closed" : "ACTIVE";
		console.log(`- [${status}] ${row.started_at || "?"} — ${summary} (${row.message_count || 0} messages)`);
	}
}
console.log("");

console.log("### Preferences");
for (const row of query("global", "knowledge",
	"SELECT category, key, value FROM preferences ORDER BY category LIMIT 10;")) {
	if (row.key && row.value) console.log(`- [${row.category}] ${row.key}: ${row.value}`);
}
console.log("");

process.exit(0);
