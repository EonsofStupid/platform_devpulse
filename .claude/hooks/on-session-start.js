#!/usr/bin/env node
// on-session-start.js — runs on workspace folderOpen via .vscode/tasks.json
// Portable: uses cwd, never hardcoded paths.
// Restores Banter session context by delegating to restore-memory.js.
// Silent on failure — never blocks the IDE.

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const HOOK_DIR = __dirname;
const WORKSPACE = path.resolve(HOOK_DIR, "..", "..");
const ENV_FILE = path.join(WORKSPACE, ".userdata", ".claude-session.env");
const RESTORE = path.join(HOOK_DIR, "restore-memory.js");

try {
	fs.mkdirSync(path.dirname(ENV_FILE), { recursive: true });
} catch {
	/* ignore */
}

const payload = JSON.stringify({
	cwd: WORKSPACE,
	env_file: ENV_FILE,
	source: "vscode-folderOpen",
});

if (fs.existsSync(RESTORE)) {
	const r = spawnSync(process.execPath, [RESTORE], {
		input: payload,
		encoding: "utf-8",
		timeout: 15000,
	});
	if (r.stdout) process.stdout.write(r.stdout);
	if (r.stderr) process.stderr.write(r.stderr);
}

process.stdout.write(
	`[Banter] session start — workspace=${WORKSPACE} env=${ENV_FILE}\n`,
);
process.exit(0);
