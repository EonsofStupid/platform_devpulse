#!/usr/bin/env node
// save-chat.js - Saves user prompts to SurrealDB on every message
// Triggered by UserPromptSubmit hook (async, non-blocking)
// Writes to: agents/claude (chat + sessions tables)

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

// Strip IDE selection noise, keep only the user's actual text
let cleanPrompt = prompt;
const ideMatch = prompt.match(/^(.*?)<ide_selection>/s);
const afterIde = prompt.match(/<\/ide_selection>(.*)/s);
if (ideMatch && afterIde) {
	cleanPrompt = (ideMatch[1] + afterIde[1]).trim();
}
// Cap at 2000 chars to avoid timeout on huge pastes
if (cleanPrompt.length > 2000) {
	cleanPrompt = cleanPrompt.slice(0, 2000) + "... [truncated]";
}

// Escape single quotes for SurrealQL
const safePrompt = cleanPrompt.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const safeCwd = cwd.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

// Save to agents/claude chat table
query(
	"agents", "claude",
	`INSERT INTO chat { role: 'user', content: '${safePrompt}', session_id: '${sessionId}' };`,
);

// Upsert session tracker in agents/claude sessions table
query(
	"agents", "claude",
	`UPSERT sessions:${sessionId.replace(/-/g, "_")} SET session_id = '${sessionId}', project = '${safeCwd}', last_active = time::now(), message_count += 1;`,
);

process.exit(0);
