#!/usr/bin/env node
// save-state.js — PreCompact hook
//
// Writes the compaction timestamp + trigger to `projects/devpulse.context`
// so the next SessionStart can reason about why we just compacted.
//
// SurrealDB: probes local 8842 first, falls back to cloud, via the
// shared _surreal.js library. All endpoint / credential / header
// constants live in _surreal.js — never redefine them here.
//
// Failure mode: every step is fail-soft. MUST NOT block compaction.

const fs = require("node:fs");
const surreal = require("./_surreal.js");

const endpoint = surreal.probe("projects", "devpulse");
if (!endpoint) {
	// Both endpoints unreachable — silently exit (never block compaction).
	process.exit(0);
}
surreal.bootstrap(endpoint, "projects", "devpulse");

let input = "";
try {
	input = fs.readFileSync(0, "utf-8");
} catch {
	// no stdin — non-fatal
}

// Update the compaction timestamp
surreal.exec(endpoint, "projects", "devpulse",
	"UPSERT context:last_compact SET key = 'last_compact', value = time::now(), priority = 5, updated_at = time::now();");

let hookData = {};
try {
	hookData = JSON.parse(input);
} catch {
	// not valid JSON — non-fatal
}

if (hookData.trigger) {
	surreal.exec(endpoint, "projects", "devpulse",
		`UPSERT context:compact_trigger SET key = 'compact_trigger', value = ${surreal.sqlString(hookData.trigger)}, priority = 3, updated_at = time::now();`);
}

process.exit(0);
