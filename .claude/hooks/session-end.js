#!/usr/bin/env node
// session-end.js — SessionEnd hook
//
// Closes the active `agents/claude` session by stamping `ended_at`.
// Reads SURREAL_SESSION_RECORD_ID from CLAUDE_ENV_FILE (written by
// restore-memory.js on SessionStart).
//
// SurrealDB: probes local 8842 first, falls back to cloud, via the
// shared _surreal.js library. All endpoint / credential / header
// constants live in _surreal.js — never redefine them here.
//
// Failure mode: every step is fail-soft. MUST NOT block session end.

const fs = require("node:fs");
const surreal = require("./_surreal.js");

const endpoint = surreal.probe("agents", "claude");
if (!endpoint) {
	process.exit(0);
}
surreal.bootstrap(endpoint, "agents", "claude");

let hookData = {};
try {
	const input = fs.readFileSync(0, "utf-8");
	hookData = JSON.parse(input);
} catch {
	// no stdin or invalid JSON — non-fatal
}

let sessionRecordId = null;
const envFile = hookData.env_file || process.env.CLAUDE_ENV_FILE;
if (envFile) {
	try {
		const envContent = fs.readFileSync(envFile, "utf-8");
		const match = envContent.match(/^SURREAL_SESSION_RECORD_ID=(.+)$/m);
		if (match) sessionRecordId = match[1].trim();
	} catch {
		// env file not available — non-fatal
	}
}

if (!sessionRecordId) {
	process.exit(0);
}

surreal.exec(endpoint, "agents", "claude",
	`UPDATE ${sessionRecordId} SET ended_at = time::now();`);

process.exit(0);
