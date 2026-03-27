#!/usr/bin/env node
// track-files.js - Logs file operations to SurrealDB
// Triggered by PostToolUse hook (matcher: Write|Edit), async
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
	process.exit(0);
}

// Extract file path from tool input
const toolInput = hookData.tool_input || {};
const filePath = toolInput.file_path || "";
if (!filePath) {
	process.exit(0);
}

// Determine action from tool name
const toolName = hookData.tool_name || "";
const action = (toolName === "Write") ? "written" : "modified";

// Read session info from CLAUDE_ENV_FILE
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

if (!sessionRecordId) {
	process.exit(0);
}

const safePath = filePath.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

query(
	"agents", "claude",
	`INSERT INTO files_touched { path: '${safePath}', action: '${action}', session_id: '${sessionId}', session: ${sessionRecordId}, created_at: time::now() };`,
);

process.exit(0);
