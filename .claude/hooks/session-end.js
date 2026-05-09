#!/usr/bin/env node
// session-end.js - Closes the active session in SurrealDB
// Triggered by SessionEnd hook
// Reads SURREAL_SESSION_RECORD_ID from CLAUDE_ENV_FILE
//
// Uses curl to HTTP /sql endpoint (surreal sql CLI cannot connect — /rpc not exposed)
// Auth: devpulse_engine:dp_sys_2026! via Basic Auth

const { spawnSync } = require("child_process");
const fs = require("fs");

// Probe local 8822 first; fall back to cloud. Headers are ALWAYS
// lowercase `surreal-ns` / `surreal-db` per the canonical SurrealDB
// HTTP convention (https://surrealdb.com/docs/surrealdb/integration/http).
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
		return result.status === 0;
	} catch (e) {
		return false;
	}
}

if (!probe()) {
	// Both endpoints unreachable — silently exit (never block session end).
	process.exit(0);
}

// Read hook input from stdin
let hookData = {};
try {
	const input = fs.readFileSync(0, "utf-8");
	hookData = JSON.parse(input);
} catch (e) {
	// no stdin or invalid JSON
}

// Read session record ID from CLAUDE_ENV_FILE
let sessionRecordId = null;
const envFile = hookData.env_file || process.env.CLAUDE_ENV_FILE;
if (envFile) {
	try {
		const envContent = fs.readFileSync(envFile, "utf-8");
		const match = envContent.match(/^SURREAL_SESSION_RECORD_ID=(.+)$/m);
		if (match) sessionRecordId = match[1].trim();
	} catch (e) {
		// env file not available
	}
}

if (!sessionRecordId) {
	process.exit(0);
}

// Close the session
query(
	"agents", "claude",
	`UPDATE ${sessionRecordId} SET ended_at = time::now();`,
);

process.exit(0);
