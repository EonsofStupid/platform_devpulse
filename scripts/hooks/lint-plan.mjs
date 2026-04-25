#!/usr/bin/env node
/**
 * lint-plan.mjs
 *
 * Top-level wrapper around the planning-skill plan validator. Forwards
 * arguments to `scripts/docs/pipeline/lint-plan.ts` (which lives inside
 * the @devpulse/docs-enforcement workspace package because that's where
 * yaml + remark-parse + chalk + tsx are already installed).
 *
 * Usage from CLI / CI / pre-commit:
 *   node scripts/hooks/lint-plan.mjs <file.md> [<file.md> ...]
 *   node scripts/hooks/lint-plan.mjs --self
 *
 * Exit codes are forwarded unchanged from the engine:
 *   0  clean (or warnings only)
 *   1  errors found
 *   2  internal / harness failure (engine couldn't load)
 *
 * The `.claude/hooks/lint-plan.js` Stop-hook shim invokes THIS file and
 * translates exit 1 → exit 2 to gate session-end.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");        // scripts/hooks → scripts → repo
const ENGINE_DIR = resolve(REPO_ROOT, "scripts/docs");
const ENGINE_TS = resolve(ENGINE_DIR, "pipeline/lint-plan.ts");
const ENGINE_NODE_MODULES = resolve(ENGINE_DIR, "node_modules");

if (!existsSync(ENGINE_TS)) {
	process.stderr.write(
		`lint-plan.mjs: engine not found at ${ENGINE_TS}\n` +
		"  Did you run `pnpm install --filter @devpulse/docs-enforcement`?\n",
	);
	process.exit(2);
}

if (!existsSync(ENGINE_NODE_MODULES)) {
	process.stderr.write(
		"lint-plan.mjs: scripts/docs/node_modules/ missing.\n" +
		"  Run: pnpm install --filter @devpulse/docs-enforcement\n",
	);
	process.exit(2);
}

const args = process.argv.slice(2);

// `npx tsx <script> <args>` from inside scripts/docs/ resolves tsx and
// the engine's deps via that package's node_modules. Cross-platform.
const result = spawnSync("npx", ["tsx", ENGINE_TS, ...args], {
	cwd: ENGINE_DIR,
	stdio: "inherit",
	shell: process.platform === "win32",
});

if (result.error) {
	process.stderr.write(`lint-plan.mjs: spawn failed — ${result.error.message}\n`);
	process.exit(2);
}

process.exit(result.status ?? 2);
