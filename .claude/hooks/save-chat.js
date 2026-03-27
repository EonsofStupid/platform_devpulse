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
		if (result.error || result.status !== 0) return false;
		return true;
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

// Build insert with or without session record link
if (sessionRecordId && sessionId) {
	// Full insert with typed record link
	query(
		"agents", "claude",
		`INSERT INTO chat { role: 'user', content: '${safePrompt}', session_id: '${sessionId}', session: ${sessionRecordId}, created_at: time::now() };`,
	);
	// Update session message count
	query(
		"agents", "claude",
		`UPDATE ${sessionRecordId} SET message_count += 1, last_active = time::now();`,
	);
} else {
	// Fallback: insert without record link (session_id only)
	const fallbackSid = hookData.session_id || "unknown";
	query(
		"agents", "claude",
		`INSERT INTO chat { role: 'user', content: '${safePrompt}', session_id: '${fallbackSid}', created_at: time::now() };`,
	);
}

process.exit(0);
