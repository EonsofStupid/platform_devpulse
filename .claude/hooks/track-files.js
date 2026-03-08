#!/usr/bin/env node
// track-files.js - Logs file operations to SurrealDB
// Triggered by PostToolUse hook (matcher: Write|Edit), async
// Reads SURREAL_SESSION_RECORD_ID from CLAUDE_ENV_FILE

const { spawnSync } = require("child_process");
const fs = require("fs");

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
			],
			{
				input: sql,
				encoding: "utf-8",
				timeout: 5000,
			},
		);
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
let action = "modified";
if (toolName === "Write") {
	// Could be create or modify — Write overwrites, so call it "modified"
	action = "modified";
} else if (toolName === "Edit") {
	action = "modified";
}

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
	`INSERT INTO files_touched { path: '${safePath}', action: '${action}', session_id: '${sessionId}', session: ${sessionRecordId} };`,
);

process.exit(0);
