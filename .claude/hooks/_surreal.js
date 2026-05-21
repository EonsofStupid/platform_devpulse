// _surreal.js — shared SurrealDB probe + exec library for Claude Code hooks.
//
// Single source of truth for:
//   - Endpoint resolution (local 8842 → cloud fallback)
//   - Lowercase header convention (surreal-ns / surreal-db)
//   - Bootstrap (DEFINE NAMESPACE / DATABASE IF NOT EXISTS)
//   - Cross-platform NULL_DEVICE
//   - The devpulse_engine principal used by every operator hook
//
// Authority: docs/platform/CLOUD_PREFLIGHT.md is the canon. If anything
// here drifts from that doc, the doc wins. Do NOT mutate the constants
// to "fix" a probe failure — the failure is the signal.

const { spawnSync } = require("node:child_process");

const LOCAL_BASE = "http://127.0.0.1:8842";
const CLOUD_BASE = "https://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud";
const AUTH_DEVPULSE_ENGINE = "Basic " + Buffer.from("devpulse_engine:dp_sys_2026!").toString("base64");
const NULL_DEVICE = process.platform === "win32" ? "NUL" : "/dev/null";
const LOCAL_TIMEOUT_MS = 2000;
const CLOUD_TIMEOUT_MS = 5000;
const EXEC_TIMEOUT_MS = 10_000;

/**
 * Probe local first, fall back to cloud. Returns the `/sql` endpoint URL
 * of whichever responded with HTTP 200 to `INFO FOR DB` against the
 * given (ns, db). Returns `null` if both are unreachable.
 *
 * The probe ns/db is used to validate routing — preflight should pick a
 * known-existing pair (e.g. `platform_devpulse`/`chat`) so a 200 means
 * the route is fully working, not just the SQL surface alive.
 */
function probe(ns, db) {
	const tryOne = (base, timeoutMs) => {
		try {
			const r = spawnSync("curl", [
				"-s", "-o", NULL_DEVICE, "-w", "%{http_code}",
				"-X", "POST", base + "/sql",
				"-H", "Content-Type: application/json",
				"-H", "Accept: application/json",
				"-H", `surreal-ns: ${ns}`,
				"-H", `surreal-db: ${db}`,
				"-H", `Authorization: ${AUTH_DEVPULSE_ENGINE}`,
				"-d", "INFO FOR DB;",
			], { encoding: "utf-8", timeout: timeoutMs });
			return r.stdout && r.stdout.trim() === "200";
		} catch { return false; }
	};
	if (tryOne(LOCAL_BASE, LOCAL_TIMEOUT_MS)) return LOCAL_BASE + "/sql";
	if (tryOne(CLOUD_BASE, CLOUD_TIMEOUT_MS)) return CLOUD_BASE + "/sql";
	return null;
}

/**
 * Bootstrap a namespace + database if they don't exist. Idempotent.
 * Fail-soft — caller is responsible for handling endpoint=null.
 *
 * Why: cloud rejects writes to undefined NS/DB with the misleading
 * "Couldn't write to a read only transaction" error. Always bootstrap
 * before first INSERT.
 */
function bootstrap(endpoint, ns, db) {
	if (!endpoint) return false;
	try {
		const r = spawnSync("curl", [
			"-s", "-o", NULL_DEVICE,
			"-X", "POST", endpoint,
			"-H", "Content-Type: application/json",
			"-H", "Accept: application/json",
			"-H", `Authorization: ${AUTH_DEVPULSE_ENGINE}`,
			"-d", `DEFINE NAMESPACE IF NOT EXISTS ${ns}; USE NS ${ns}; DEFINE DATABASE IF NOT EXISTS ${db};`,
		], { encoding: "utf-8", timeout: EXEC_TIMEOUT_MS });
		return r.status === 0;
	} catch { return false; }
}

/**
 * Execute SQL against a specific (ns, db). Returns parsed JSON array
 * (SurrealDB always returns an array — one element per statement) or
 * `null` on transport failure. Fail-soft — never throws.
 *
 * For single-statement queries, callers can use `exec(...)?.[0]` to
 * pull the result envelope directly.
 */
function exec(endpoint, ns, db, sql) {
	if (!endpoint) return null;
	try {
		const r = spawnSync("curl", [
			"-s", "-X", "POST", endpoint,
			"-H", "Content-Type: application/json",
			"-H", "Accept: application/json",
			"-H", `surreal-ns: ${ns}`,
			"-H", `surreal-db: ${db}`,
			"-H", `Authorization: ${AUTH_DEVPULSE_ENGINE}`,
			"-d", sql,
		], { encoding: "utf-8", timeout: EXEC_TIMEOUT_MS });
		if (r.error || r.status !== 0) return null;
		try { return JSON.parse(r.stdout); } catch { return null; }
	} catch { return null; }
}

/**
 * Extract the .result array from the first statement of a SurrealDB
 * /sql response. Used by SELECT-style queries. Returns [] on any
 * shape mismatch.
 */
function firstResult(response) {
	if (!Array.isArray(response)) return [];
	const head = response[0];
	if (!head || !Array.isArray(head.result)) return [];
	return head.result;
}

/**
 * Escape a string for inclusion in a single-quoted SurrealDB literal.
 * Doubles backslashes then escapes single quotes. Use for any
 * user-supplied content going into a literal.
 */
function sqlString(s) {
	return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

/**
 * Write a heartbeat row to `platform_devpulse.chat.heartbeats`. Designed
 * to defeat the SurrealDB Cloud free-tier 7-day auto-pause timer.
 *
 * Called from `restore-memory.js` (SessionStart) so every Claude Code
 * session opening counts as activity. `cargo xtask preflight --cloud`
 * also writes one. Idempotent — extra heartbeats are harmless.
 */
function heartbeat(endpoint, source) {
	if (!endpoint) return false;
	bootstrap(endpoint, "platform_devpulse", "chat");
	const r = exec(endpoint, "platform_devpulse", "chat",
		`INSERT INTO heartbeats { ts: time::now(), source: ${sqlString(source || "unknown")} };`);
	return r !== null;
}

module.exports = {
	LOCAL_BASE,
	CLOUD_BASE,
	NULL_DEVICE,
	probe,
	bootstrap,
	exec,
	firstResult,
	sqlString,
	heartbeat,
};
