#!/usr/bin/env node
/**
 * Preflight: no raw `invoke(` in models/chat/wizard IPC surfaces (+ logger).
 * Run: pnpm check:ipc
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, "..", "..", "src");

const SCAN_DIRS = [
	path.join(srcRoot, "lib", "domains", "app", "models", "data-access"),
	path.join(srcRoot, "lib", "domains", "chat", "data-access"),
	path.join(srcRoot, "lib", "domains", "app", "models", "feature", "setup-wizard"),
];

const EXTRA_FILES = [path.join(srcRoot, "lib", "sys", "logger.ts")];

const ALLOWLIST = new Set([
	path.normalize("lib/sys/logger.ts"),
	path.normalize("lib/sys/generated/bindings.ts"),
	path.normalize("lib/domains/app/models/feature/setup-wizard/steps/TtsConfigPanel.svelte"),
]);

function walk(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const name of fs.readdirSync(dir)) {
		const full = path.join(dir, name);
		const st = fs.statSync(full);
		if (st.isDirectory()) walk(full, out);
		else if (/\.(ts|svelte)$/.test(name)) out.push(full);
	}
	return out;
}

function rel(p) {
	return path.relative(srcRoot, p).split(path.sep).join("/");
}

const files = [];
for (const d of SCAN_DIRS) walk(d, files);
for (const f of EXTRA_FILES) files.push(f);

let failed = false;
for (const file of files) {
	const r = rel(file);
	const normalized = path.normalize(r);
	if (ALLOWLIST.has(normalized)) continue;

	const text = fs.readFileSync(file, "utf8");
	if (!text.includes("invoke(")) continue;

	console.error(`[check-no-raw-invoke] Forbidden invoke( in ${r}`);
	failed = true;
}

if (failed) {
	process.exit(1);
}
process.stdout.write("[check-no-raw-invoke] OK\n");
