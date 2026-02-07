#!/usr/bin/env node
// save-chat.js - Saves user prompts to SurrealDB on every message
// Triggered by UserPromptSubmit hook (async, non-blocking)

const { spawnSync } = require("child_process");
const fs = require("fs");

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

const sessionId = hookData.session_id || "unknown";
const prompt = hookData.prompt || "";
const cwd = hookData.cwd || "";

if (!prompt) {
	process.exit(0);
}

// Escape single quotes for SurrealQL
const safePrompt = prompt.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const safeCwd = cwd.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

// Save the message
query(`CREATE messages SET session_id = '${sessionId}', role = 'user', content = '${safePrompt}';`);

// Upsert session tracker
query(`UPSERT chat_sessions:${sessionId.replace(/-/g, "_")} SET session_id = '${sessionId}', last_active = time::now(), message_count += 1, project_dir = '${safeCwd}';`);

process.exit(0);
