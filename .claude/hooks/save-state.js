#!/usr/bin/env node
// save-state.js - Saves current session state to SurrealDB before compaction
// Triggered by PreCompact hook
// Writes to: projects/devpulse (context timestamps)

const { spawnSync } = require("child_process");

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
				"--json",
			],
			{
				input: sql,
				encoding: "utf-8",
				timeout: 10000,
			},
		);
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
	input = require("fs").readFileSync(0, "utf-8");
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
	`UPSERT context:last_compact SET key = 'last_compact', value = time::now(), priority = 5, updated_at = time::now();`,
);

// Parse hook data if available
let hookData = {};
try {
	hookData = JSON.parse(input);
} catch (e) {
	// not valid JSON
}

if (hookData.trigger) {
	query(
		"projects", "devpulse",
		`UPSERT context:compact_trigger SET key = 'compact_trigger', value = '${hookData.trigger}', priority = 3, updated_at = time::now();`,
	);
}

process.exit(0);
