#!/usr/bin/env node
// banter-dump.js — UserPromptSubmit + Stop hook
//
// On UserPromptSubmit:
//   1. Append cleaned user turn to .claude/dumps/<YYYY-MM-DD>/<sessionId>.live.jsonl
//   2. INSERT into SurrealDB NS=platform_devpulse DB=chat TABLE=turns
//
// On Stop:
//   1. Copy the full Claude Code transcript .jsonl from
//      ~/.claude/projects/d--localdev-platform-devpulse/<sessionId>.jsonl
//      to .claude/dumps/<YYYY-MM-DD>/<sessionId>.transcript.jsonl
//   2. INSERT a session-end marker into SurrealDB sessions table
//
// SurrealDB: probe local 8822 first, fall back to cloud.
// Headers are LOWERCASE surreal-ns / surreal-db per locked rule.
// Auth: Basic devpulse_engine:dp_sys_2026!
// Schemaless mode — tables auto-create on INSERT.
//
// Failure mode: every step is fail-soft. The hook MUST NOT block the prompt.

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const VERB = process.argv[2] || "user-prompt";

const LOCAL_BASE = "http://127.0.0.1:8822";
const CLOUD_BASE = "https://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud";
const AUTH = "Basic " + Buffer.from("devpulse_engine:dp_sys_2026!").toString("base64");
const NS = "platform_devpulse";
const DB = "chat";

const HOOK_DIR = __dirname;
const PROJECT_ROOT = path.resolve(HOOK_DIR, "..", "..");
const DUMP_ROOT = path.join(PROJECT_ROOT, ".claude", "dumps");
const TRANSCRIPT_ROOT = path.join(os.homedir(), ".claude", "projects", "d--localdev-platform-devpulse");
const NULL_DEVICE = process.platform === "win32" ? "NUL" : "/dev/null";

function bootstrap(base, ms) {
	try {
		spawnSync("curl", [
			"-s", "-o", NULL_DEVICE,
			"-X", "POST", base + "/sql",
			"-H", "Content-Type: application/json",
			"-H", "Accept: application/json",
			"-H", `Authorization: ${AUTH}`,
			"-d", `DEFINE NAMESPACE IF NOT EXISTS ${NS}; USE NS ${NS}; DEFINE DATABASE IF NOT EXISTS ${DB};`,
		], { encoding: "utf-8", timeout: ms });
	} catch { /* fail-soft */ }
}

function probe() {
	const tryOne = (base, ms) => {
		try {
			const r = spawnSync("curl", [
				"-s", "-o", NULL_DEVICE, "-w", "%{http_code}",
				"-X", "POST", base + "/sql",
				"-H", "Content-Type: application/json",
				"-H", "Accept: application/json",
				"-H", `surreal-ns: ${NS}`,
				"-H", `surreal-db: ${DB}`,
				"-H", `Authorization: ${AUTH}`,
				"-d", "INFO FOR DB;",
			], { encoding: "utf-8", timeout: ms });
			return r.stdout && r.stdout.trim() === "200";
		} catch { return false; }
	};
	if (tryOne(LOCAL_BASE, 2000)) {
		bootstrap(LOCAL_BASE, 3000);
		return LOCAL_BASE + "/sql";
	}
	if (tryOne(CLOUD_BASE, 5000)) {
		bootstrap(CLOUD_BASE, 5000);
		return CLOUD_BASE + "/sql";
	}
	return null;
}

function exec(endpoint, sql) {
	if (!endpoint) return null;
	try {
		const r = spawnSync("curl", [
			"-s", "-X", "POST", endpoint,
			"-H", "Content-Type: application/json",
			"-H", "Accept: application/json",
			"-H", `surreal-ns: ${NS}`,
			"-H", `surreal-db: ${DB}`,
			"-H", `Authorization: ${AUTH}`,
			"-d", sql,
		], { encoding: "utf-8", timeout: 5000 });
		if (r.error || r.status !== 0) return null;
		return r.stdout;
	} catch { return null; }
}

function readStdin() {
	try { return fs.readFileSync(0, "utf-8"); } catch { return ""; }
}

function ensureDir(p) {
	fs.mkdirSync(p, { recursive: true });
}

function dumpDir() {
	const date = new Date().toISOString().slice(0, 10);
	const dir = path.join(DUMP_ROOT, date);
	ensureDir(dir);
	return dir;
}

function sqlString(s) {
	return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

function cleanPrompt(raw) {
	let clean = String(raw || "");
	const ideMatch = clean.match(/^(.*?)<ide_selection>/s);
	const afterIde = clean.match(/<\/ide_selection>(.*)/s);
	if (ideMatch && afterIde) clean = (ideMatch[1] + afterIde[1]).trim();
	clean = clean.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
	return clean;
}

function handleUserPrompt(payload) {
	const sessionId = payload.session_id || payload.sessionId || "unknown";
	const promptRaw = payload.prompt || payload.user_prompt || "";
	const clean = cleanPrompt(promptRaw);
	if (!clean) return;

	const cwd = payload.cwd || process.cwd();
	const ts = new Date().toISOString();

	try {
		const file = path.join(dumpDir(), `${sessionId}.live.jsonl`);
		fs.appendFileSync(file, JSON.stringify({
			ts, session_id: sessionId, event: "user_prompt", cwd, body: clean,
		}) + "\n", "utf-8");
	} catch { /* fail-soft */ }

	const endpoint = probe();
	if (!endpoint) return;

	const cap = clean.length > 4000 ? clean.slice(0, 4000) + "... [truncated]" : clean;
	exec(endpoint,
		`INSERT INTO turns { role: 'user', body: ${sqlString(cap)}, session_id: ${sqlString(sessionId)}, cwd: ${sqlString(cwd)}, created_at: time::now() };`
	);
}

function handleStop(payload) {
	const sessionId = payload.session_id || payload.sessionId || "unknown";
	if (sessionId === "unknown") return;

	const src = path.join(TRANSCRIPT_ROOT, `${sessionId}.jsonl`);
	if (fs.existsSync(src)) {
		try {
			const dst = path.join(dumpDir(), `${sessionId}.transcript.jsonl`);
			fs.copyFileSync(src, dst);
		} catch { /* fail-soft */ }
	}

	const endpoint = probe();
	if (!endpoint) return;
	const cwd = payload.cwd || process.cwd();
	exec(endpoint,
		`INSERT INTO sessions { session_id: ${sqlString(sessionId)}, ended_at: time::now(), cwd: ${sqlString(cwd)} };`
	);
}

const raw = readStdin();
if (!raw) process.exit(0);

let payload;
try { payload = JSON.parse(raw); } catch { process.exit(0); }

if (VERB === "user-prompt") handleUserPrompt(payload);
else if (VERB === "stop") handleStop(payload);

process.exit(0);
