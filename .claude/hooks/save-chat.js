#!/usr/bin/env node
// save-chat.js - Saves user prompts to SurrealDB on every message
// Triggered by UserPromptSubmit hook (async, non-blocking)
// Writes to: agents/claude (chat + sessions tables)
// Reads SURREAL_SESSION_RECORD_ID from CLAUDE_ENV_FILE for record linking
//
// Uses curl to HTTP /sql endpoint (surreal sql CLI cannot connect — /rpc not exposed)
// Auth: devpulse_engine:dp_sys_2026! via Basic Auth

const { spawnSync } = require("child_process");
const fs = require("fs");

// Probe local 8822 first; fall back to cloud if local is down. Mirrors
// the pattern in restore-memory.js so the WRITE side has the same
// resilience as the READ side.
//
// Headers are ALWAYS lowercase `surreal-ns` / `surreal-db` per the
// canonical SurrealDB HTTP convention (verified against
// https://surrealdb.com/docs/surrealdb/integration/http on 2026-05-09).
// HTTP headers are case-insensitive so lowercase works on every
// SurrealDB version including local 8822 — one pattern, no flip.
const LOCAL_BASE = "http://127.0.0.1:8822";
const CLOUD_BASE = "https://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud";
const AUTH = "Basic " + Buffer.from("devpulse_engine:dp_sys_2026!").toString("base64");

let ENDPOINT = null;

function probe() {
	const tryProbe = (base, timeoutMs) => {
		try {
			const r = spawnSync("curl", [
				"-s", "-o", "/dev/null", "-w", "%{http_code}",
				"-X", "POST", base + "/sql",
				"-H", "Content-Type: application/json",
				"-H", "Accept: application/json",
				"-H", "surreal-ns: agents",
				"-H", "surreal-db: claude",
				"-H", `Authorization: ${AUTH}`,
				"-d", "INFO FOR DB;",
			], { encoding: "utf-8", timeout: timeoutMs });
			return r.stdout && r.stdout.trim() === "200";
		} catch { return false; }
	};
	if (tryProbe(LOCAL_BASE, 2000)) { ENDPOINT = LOCAL_BASE + "/sql"; return true; }
	if (tryProbe(CLOUD_BASE, 5000)) { ENDPOINT = CLOUD_BASE + "/sql"; return true; }
	return false;
}

function query(ns, db, sql) {
	if (!ENDPOINT) return false;
	try {
		const result = spawnSync("curl", [
			"-s", "-X", "POST", ENDPOINT,
			"-H", "Content-Type: application/json",
			"-H", "Accept: application/json",
			"-H", `surreal-ns: ${ns}`,
			"-H", `surreal-db: ${db}`,
			"-H", `Authorization: ${AUTH}`,
			"-d", sql,
		], {
			encoding: "utf-8",
			timeout: 5000,
		});
		if (result.error || result.status !== 0) return false;
		return true;
	} catch (e) {
		return false;
	}
}

if (!probe()) {
	// Both endpoints unreachable — silently exit (never block the prompt).
	process.exit(0);
}

// Read hook input from stdin
let input = "";
try {
	input = fs.readFileSync(0, "utf-8");
} catch (e) {
	process.exit(0);
}

let hookData = {};
try {
	hookData = JSON.parse(input);
} catch (e) {
	process.exit(0);
}

const prompt = hookData.prompt || "";
if (!prompt) {
	process.exit(0);
}

// Read session record ID from CLAUDE_ENV_FILE
let sessionRecordId = null;
let sessionId = null;
const envFile = hookData.env_file || process.env.CLAUDE_ENV_FILE;
if (envFile) {
	try {
		const envContent = fs.readFileSync(envFile, "utf-8");
		const recordMatch = envContent.match(/^SURREAL_SESSION_RECORD_ID=(.+)$/m);
		const sidMatch = envContent.match(/^SURREAL_SESSION_ID=(.+)$/m);
		if (recordMatch) sessionRecordId = recordMatch[1].trim();
		if (sidMatch) sessionId = sidMatch[1].trim();
	} catch (e) {
		// env file not available
	}
}

// Strip IDE selection noise, keep only the user's actual text
let cleanPrompt = prompt;
const ideMatch = prompt.match(/^(.*?)<ide_selection>/s);
const afterIde = prompt.match(/<\/ide_selection>(.*)/s);
if (ideMatch && afterIde) {
	cleanPrompt = (ideMatch[1] + afterIde[1]).trim();
}
// Also strip system-reminder tags
cleanPrompt = cleanPrompt.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
// Cap at 2000 chars to avoid timeout on huge pastes
if (cleanPrompt.length > 2000) {
	cleanPrompt = cleanPrompt.slice(0, 2000) + "... [truncated]";
}

// Escape single quotes for SurrealQL
const safePrompt = cleanPrompt.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

// chat.session is a REQUIRED record<sessions> field on the cloud schema
// (verified 2026-05-09). If env_file didn't give us a session record id,
// look up the active session or create one — never insert without the
// session link, the schema rejects it.
function querySelect(ns, db, sql) {
	if (!ENDPOINT) return [];
	try {
		const r = spawnSync("curl", [
			"-s", "-X", "POST", ENDPOINT,
			"-H", "Content-Type: application/json",
			"-H", "Accept: application/json",
			"-H", `surreal-ns: ${ns}`,
			"-H", `surreal-db: ${db}`,
			"-H", `Authorization: ${AUTH}`,
			"-d", sql,
		], { encoding: "utf-8", timeout: 5000 });
		if (r.error || r.status !== 0) return [];
		const parsed = JSON.parse(r.stdout);
		if (Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0].result)) {
			return parsed[0].result;
		}
		return [];
	} catch { return []; }
}

if (!sessionRecordId || !sessionId) {
	// Try to find an active (open) session first.
	const active = querySelect("agents", "claude",
		"SELECT * FROM sessions WHERE ended_at = NONE ORDER BY started_at DESC LIMIT 1;");
	if (active.length > 0 && active[0].id) {
		sessionRecordId = active[0].id;
		sessionId = active[0].session_id;
	} else {
		// Create a fresh session.
		const fallbackSid = (hookData.session_id || "unknown").replace(/'/g, "\\'");
		const created = querySelect("agents", "claude",
			`CREATE sessions SET session_id = '${fallbackSid}', project = '${process.cwd().replace(/\\/g, "\\\\").replace(/'/g, "\\'")}', started_at = time::now(), message_count = 0;`);
		if (created.length > 0 && created[0].id) {
			sessionRecordId = created[0].id;
			sessionId = created[0].session_id;
		}
	}
}

if (sessionRecordId && sessionId) {
	query(
		"agents", "claude",
		`INSERT INTO chat { role: 'user', content: '${safePrompt}', session_id: '${sessionId}', session: ${sessionRecordId}, created_at: time::now() };`,
	);
	query(
		"agents", "claude",
		`UPDATE ${sessionRecordId} SET message_count += 1, last_active = time::now();`,
	);
}

process.exit(0);
