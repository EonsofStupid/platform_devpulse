#!/usr/bin/env node
// lint-plan.js — Stop-hook shim for the /planning skill's plan validator.
// Companion to verify-on-stop.js (CC-001).
//
// Behavior:
//   1. Discover all `~/.claude/plans/*.md` files that have a `schema_version:`
//      key in their first 30 lines (i.e. plans authored under the new schema).
//   2. Invoke the wrapper at scripts/hooks/lint-plan.mjs against each.
//   3. If the wrapper exits 1 (validation errors), this hook exits 2 to
//      block session-end (matches verify-on-stop.js's gating idiom).
//   4. If scripts/docs/node_modules/ is missing (cold deps), exit 0 with
//      a stderr warning — never block a session because of missing deps.

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const WRAPPER = path.join(REPO_ROOT, "scripts", "hooks", "lint-plan.mjs");
const ENGINE_NODE_MODULES = path.join(REPO_ROOT, "scripts", "docs", "node_modules");
const PLANS_DIR = path.join(os.homedir(), ".claude", "plans");

const e = process.stderr;

// ── Cold-deps escape hatch — never block a session on missing node_modules ──
if (!fs.existsSync(ENGINE_NODE_MODULES)) {
	e.write(
		"lint-plan: scripts/docs/node_modules/ missing — skipping plan validation.\n" +
		"  Run: pnpm install --filter @devpulse/docs-enforcement\n",
	);
	process.exit(0);
}

if (!fs.existsSync(WRAPPER)) {
	e.write(`lint-plan: wrapper not found at ${WRAPPER} — skipping.\n`);
	process.exit(0);
}

if (!fs.existsSync(PLANS_DIR)) {
	// No plans directory yet — nothing to lint.
	process.exit(0);
}

// ── Discover plans with `schema_version:` in their first 30 lines ──
function hasSchemaVersion(filePath) {
	try {
		const fd = fs.openSync(filePath, "r");
		const buf = Buffer.alloc(2048);
		const bytes = fs.readSync(fd, buf, 0, 2048, 0);
		fs.closeSync(fd);
		const head = buf.slice(0, bytes).toString("utf8");
		return /^\s*schema_version\s*:\s*\d+/m.test(head);
	} catch {
		return false;
	}
}

let plans;
try {
	plans = fs
		.readdirSync(PLANS_DIR)
		.filter((f) => f.endsWith(".md") && !f.startsWith("_"))
		.map((f) => path.join(PLANS_DIR, f))
		.filter(hasSchemaVersion);
} catch (err) {
	e.write(`lint-plan: readdir failed — ${err.message}\n`);
	process.exit(0); // never block on transient FS errors
}

if (plans.length === 0) {
	// No v1-shaped plans yet. Silent skip.
	process.exit(0);
}

e.write(`lint-plan: validating ${plans.length} plan(s) against schema.yml\n`);

const result = spawnSync("node", [WRAPPER, ...plans], {
	cwd: REPO_ROOT,
	stdio: "inherit",
	shell: process.platform === "win32",
});

if (result.error) {
	e.write(`lint-plan: spawn failed — ${result.error.message}\n`);
	process.exit(0); // harness failure should not block; verify-on-stop covers compile gate
}

// Translate engine's exit-1 (errors) → exit-2 (Stop-hook block).
// Engine's exit-2 (its own internal failure) → exit-0 (don't block on tooling bugs).
const code = result.status ?? 0;
if (code === 1) process.exit(2);
process.exit(0);
