#!/usr/bin/env node
// restore-memory.js - Creates/restores session, queries SurrealDB for context
// Output goes directly to Claude's context via SessionStart hook
//
// Queries 3 namespaces:
//   global/knowledge  — preferences, critical learnings
//   projects/devpulse — context, pending tasks, architecture rules
//   agents/claude     — recent sessions, unresolved blockers
//
// Creates a session in agents/claude and writes the record ID to CLAUDE_ENV_FILE
//
// Uses curl to HTTP /sql endpoint (surreal sql CLI cannot connect — /rpc not exposed)
// Auth: devpulse_engine:dp_sys_2026! via Basic Auth

const { spawnSync } = require("child_process");
const fs = require("fs");

const LOCAL_BASE = "http://127.0.0.1:8822";
const CLOUD_BASE = "https://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud";
const AUTH = "Basic " + Buffer.from("devpulse_engine:dp_sys_2026!").toString("base64");

// Probe local first; fall back to cloud. ENDPOINT is set by chooseEndpoint().
let ENDPOINT = LOCAL_BASE + "/sql";
function chooseEndpoint() {
	const probe = (base, timeoutMs) => {
		try {
			const r = spawnSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}",
				"-X", "POST", base + "/sql",
				"-H", "Accept: application/json",
				"-H", "NS: global", "-H", "DB: knowledge",
				"-H", `Authorization: ${AUTH}`,
				"-d", "INFO FOR DB;",
			], { encoding: "utf-8", timeout: timeoutMs });
			return r.stdout && r.stdout.trim() === "200";
		} catch (e) { return false; }
	};
	if (probe(LOCAL_BASE, 3000)) { ENDPOINT = LOCAL_BASE + "/sql"; return "local"; }
	if (probe(CLOUD_BASE, 8000)) { ENDPOINT = CLOUD_BASE + "/sql"; return "cloud"; }
	return null;
}

// Read hook input from stdin for CLAUDE_ENV_FILE
let hookData = {};
try {
	const input = fs.readFileSync(0, "utf-8");
	hookData = JSON.parse(input);
} catch (e) {
	// no stdin or invalid JSON
}

function query(ns, db, sql) {
	try {
		const result = spawnSync("curl", [
			"-s", "-X", "POST", ENDPOINT,
			"-H", "Accept: application/json",
			"-H", `NS: ${ns}`,
			"-H", `DB: ${db}`,
			"-H", `Authorization: ${AUTH}`,
			"-d", sql,
		], {
			encoding: "utf-8",
			timeout: 10000,
		});
		if (result.error || result.status !== 0) return [];
		const parsed = JSON.parse(result.stdout);
		// SurrealDB HTTP returns array of results, each with "result" key
		if (Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0].result)) {
			return parsed[0].result;
		}
		return [];
	} catch (e) {
		return [];
	}
}

// Pick local-or-cloud endpoint before issuing real queries
const where = chooseEndpoint();
if (!where) {
	console.log("[Banter: SurrealDB unreachable — local 8822 down, cloud unreachable. Skipping memory restore.]");
	process.exit(0);
}

// ── Create or find active session ──
const cwd = hookData.cwd || process.cwd();
const safeCwd = cwd.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

let sessionRecordId = null;
let sessionId = null;

const activeSession = query(
	"agents", "claude",
	"SELECT * FROM sessions WHERE ended_at = NONE ORDER BY started_at DESC LIMIT 1;",
);

if (activeSession.length > 0 && activeSession[0].id) {
	sessionRecordId = activeSession[0].id;
	sessionId = activeSession[0].session_id;
} else {
	const created = query(
		"agents", "claude",
		`CREATE sessions SET session_id = <string> rand::uuid(), project = '${safeCwd}', started_at = time::now(), message_count = 0;`,
	);
	if (created.length > 0 && created[0].id) {
		sessionRecordId = created[0].id;
		sessionId = created[0].session_id;
	}
}

// Write session ID to CLAUDE_ENV_FILE so other hooks can use it
if (sessionRecordId && hookData.env_file) {
	try {
		let envContent = "";
		try {
			envContent = fs.readFileSync(hookData.env_file, "utf-8");
		} catch (e) {
			// file may not exist yet
		}
		envContent = envContent
			.split("\n")
			.filter(l => !l.startsWith("SURREAL_SESSION_RECORD_ID=") && !l.startsWith("SURREAL_SESSION_ID="))
			.join("\n");
		envContent = envContent.trim();
		if (envContent) envContent += "\n";
		envContent += `SURREAL_SESSION_RECORD_ID=${sessionRecordId}\n`;
		envContent += `SURREAL_SESSION_ID=${sessionId}\n`;
		fs.writeFileSync(hookData.env_file, envContent);
	} catch (e) {
		// env file write failed — non-fatal
	}
}

console.log("## RESTORED CONTEXT FROM SURREALDB\n");

if (sessionRecordId) {
	console.log(`**Active Session**: \`${sessionId}\` (record: \`${sessionRecordId}\`)\n`);
}

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
	"SELECT session_id, project, summary, started_at, ended_at, message_count FROM sessions ORDER BY started_at DESC LIMIT 5;",
);
for (const row of sessions) {
	if (row.session_id) {
		const summary = row.summary || "(no summary)";
		const status = row.ended_at ? "closed" : "ACTIVE";
		console.log(`- [${status}] ${row.started_at || "?"} — ${summary} (${row.message_count || 0} messages)`);
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
