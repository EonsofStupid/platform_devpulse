#!/usr/bin/env node
// save-state.js - Saves current session state to SurrealDB before compaction
// Triggered by PreCompact hook

const { spawnSync } = require("child_process");

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
				"--json",
			],
			{
				input: sql,
				encoding: "utf-8",
				timeout: 10000,
			},
		);
		if (result.error || result.status !== 0) {
			return null;
		}
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
const test = query("INFO FOR DB;");
if (!test) {
	process.exit(0);
}

// Update the compaction timestamp
query(
	`UPSERT context:last_compact SET key = 'last_compact', value = time::now(), priority = 5, updated_at = time::now();`,
);

// Read the transcript if available to extract recent learnings
let hookData = {};
try {
	hookData = JSON.parse(input);
} catch (e) {
	// not valid JSON
}

if (hookData.trigger) {
	query(
		`UPSERT context:compact_trigger SET key = 'compact_trigger', value = '${hookData.trigger}', priority = 3, updated_at = time::now();`,
	);
}

process.exit(0);
