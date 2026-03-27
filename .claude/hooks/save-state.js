#!/usr/bin/env node
// save-state.js - Saves current session state to SurrealDB before compaction
// Triggered by PreCompact hook
// Writes to: projects/devpulse (context timestamps)
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
			timeout: 10000,
		});
		if (result.error || result.status !== 0) return null;
		const parsed = JSON.parse(result.stdout);
		return parsed[0] || null;
	} catch (e) {
		return null;
	}
}

// Read hook input from stdin
let input = "";
try {
	input = fs.readFileSync(0, "utf-8");
} catch (e) {
	// no stdin
}

// Test connectivity
const test = query("projects", "devpulse", "INFO FOR DB;");
if (!test) {
	process.exit(0);
}

// Update the compaction timestamp in projects/devpulse context
query(
	"projects", "devpulse",
	"UPSERT context:last_compact SET key = 'last_compact', value = time::now(), priority = 5, updated_at = time::now();",
);

// Parse hook data if available
let hookData = {};
try {
	hookData = JSON.parse(input);
} catch (e) {
	// not valid JSON
}

if (hookData.trigger) {
	const safeTrigger = hookData.trigger.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
	query(
		"projects", "devpulse",
		`UPSERT context:compact_trigger SET key = 'compact_trigger', value = '${safeTrigger}', priority = 3, updated_at = time::now();`,
	);
}

process.exit(0);
