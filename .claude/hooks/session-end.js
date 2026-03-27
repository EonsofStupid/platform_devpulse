#!/usr/bin/env node
// session-end.js - Closes the active session in SurrealDB
// Triggered by SessionEnd hook
// Reads SURREAL_SESSION_RECORD_ID from CLAUDE_ENV_FILE
//
// Uses curl to HTTP /sql endpoint (surreal sql CLI cannot connect — /rpc not exposed)
// Auth: devpulse_engine:dp_sys_2026! via Basic Auth

const { spawnSync } = require("child_process");
const fs = require("fs");

const ENDPOINT = "http://127.0.0.1:8822/sql";
const AUTH = "Basic " + Buffer.from("devpulse_engine:dp_sys_2026!").toString("base64");

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
			timeout: 5000,
		});
		return result.status === 0;
	} catch (e) {
		return false;
	}
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
