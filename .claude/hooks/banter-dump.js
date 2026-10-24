#!/usr/bin/env node
// banter-dump.js — UserPromptSubmit + Stop hook
//
// On UserPromptSubmit:
//   1. Append cleaned user turn to .claude/dumps/<YYYY-MM-DD>/<sessionId>.live.jsonl
//   2. INSERT into SurrealDB NS=platform_devpulse DB=chat TABLE=turns
//
// On Stop:
//   1. Copy the full Claude Code transcript .jsonl (the hook payload's
//      `transcript_path`) to .claude/dumps/<YYYY-MM-DD>/<sessionId>.transcript.jsonl
//   2. INSERT a session-end marker into SurrealDB sessions table
//
// SurrealDB: probes local 8842 first, falls back to cloud, via the
// shared _surreal.js library. Headers are lowercase per the SSOT
// (docs/platform/CLOUD_PREFLIGHT.md). All credential + endpoint
// constants are owned by _surreal.js — do not redefine here.
//
// Failure mode: every step is fail-soft. The hook MUST NOT block the prompt.

const fs = require("node:fs");
const path = require("node:path");
const surreal = require("./_surreal.js");

const VERB = process.argv[2] || "user-prompt";
const NS = "platform_devpulse";
const DB = "chat";

const HOOK_DIR = __dirname;
const PROJECT_ROOT = path.resolve(HOOK_DIR, "..", "..");
const DUMP_ROOT = path.join(PROJECT_ROOT, ".claude", "dumps");

function readStdin() {
	try { return fs.readFileSync(0, "utf-8"); } catch { return ""; }
}

function dumpDir() {
	const date = new Date().toISOString().slice(0, 10);
	const dir = path.join(DUMP_ROOT, date);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function cleanPrompt(raw) {
	let clean = String(raw || "");
	const ideMatch = clean.match(/^(.*?)<ide_selection>/s);
	const afterIde = clean.match(/<\/ide_selection>(.*)/s);
	if (ideMatch && afterIde) clean = (ideMatch[1] + afterIde[1]).trim();
	clean = clean.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
	return clean;
}

function endpoint() {
	const ep = surreal.probe(NS, DB);
	if (ep) surreal.bootstrap(ep, NS, DB);
	return ep;
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

	const ep = endpoint();
	if (!ep) return;

	const cap = clean.length > 4000 ? clean.slice(0, 4000) + "... [truncated]" : clean;
	surreal.exec(ep, NS, DB,
		`INSERT INTO turns { role: 'user', body: ${surreal.sqlString(cap)}, session_id: ${surreal.sqlString(sessionId)}, cwd: ${surreal.sqlString(cwd)}, created_at: time::now() };`);
}

function handleStop(payload) {
	const sessionId = payload.session_id || payload.sessionId || "unknown";
	if (sessionId === "unknown") return;

	// Claude Code passes the transcript's location in every hook payload;
	// never derive it from the machine-specific project folder name.
	const src = payload.transcript_path;
	if (src && fs.existsSync(src)) {
		try {
			const dst = path.join(dumpDir(), `${sessionId}.transcript.jsonl`);
			fs.copyFileSync(src, dst);
		} catch { /* fail-soft */ }
	}

	const ep = endpoint();
	if (!ep) return;
	const cwd = payload.cwd || process.cwd();
	surreal.exec(ep, NS, DB,
		`INSERT INTO sessions { session_id: ${surreal.sqlString(sessionId)}, ended_at: time::now(), cwd: ${surreal.sqlString(cwd)} };`);
}

const raw = readStdin();
if (!raw) process.exit(0);

let payload;
try { payload = JSON.parse(raw); } catch { process.exit(0); }

if (VERB === "user-prompt") handleUserPrompt(payload);
else if (VERB === "stop") handleStop(payload);

process.exit(0);
