#!/usr/bin/env node
/**
 * @file css-var-audit.mjs
 * @package @devpulse/coldlight
 *
 * ColdLight custom-property chain auditor.
 * Usage: node scripts/audit/css-var-audit.mjs [--json <outfile>]
 *
 * The design system delivers ALL styling through CSS custom properties
 * (SD5 tokens -> @layer tokens.* -> component consumption). A var() whose
 * property was never defined resolves to the guaranteed-invalid value and
 * the declaration silently falls back — the UI renders unstyled/wrong with
 * zero console errors. This script makes those silent breaks visible:
 *
 *   1. UNDEFINED   — var(--x) consumed, --x defined nowhere (broken chain)
 *   2. DEAD        — --x defined, consumed nowhere (dead weight / drift)
 *   3. CONTESTED   — --x defined in 2+ files (cascade fights, shim debt)
 *
 * Scans: src/**\/*.{css,svelte} for CSS definitions + consumptions, and
 * src/**\/*.{ts,svelte} for JS-set definitions (setProperty / cssVars maps).
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const SKIP_DIRS = new Set([
	"node_modules",
	".svelte-kit",
	"build",
	"dist",
	"storybook-static",
	".cowlevel",
]);

// Registered @property names and dynamic axes RenderForge sets at runtime
// are defined outside static CSS; treat prefixes listed here as runtime-defined.
const RUNTIME_DEFINED_PREFIXES = ["--style-", "--svg-"];

/** @returns {string[]} */
function walk(dir, exts, acc = []) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) {
			if (!SKIP_DIRS.has(name)) walk(full, exts, acc);
		} else if (exts.some((e) => name.endsWith(e))) {
			acc.push(full);
		}
	}
	return acc;
}

// Prefix class includes quote chars: Svelte template style attributes
// (style="--x: var(...)") define custom properties at runtime — without
// the quotes, component-scoped indirections (--store-accent et al.) show
// up as false-positive UNDEFINED (found by the Pass-3 binding audit).
const DEFINE_RE = /(?:^|[{;\s"'`:])(--[a-zA-Z0-9-]+)\s*[:=]/gm;
const CONSUME_RE = /var\(\s*(--[a-zA-Z0-9-]+)/gm;
const JS_SET_RE = /(?:setProperty\(\s*|["'`])(--[a-zA-Z0-9-]+)["'`]\s*[,:)]/gm;
const AT_PROPERTY_RE = /@property\s+(--[a-zA-Z0-9-]+)/gm;

/** name -> Set<relPath> */
const defined = new Map();
/** name -> Set<relPath> */
const consumed = new Map();

function record(map, name, file) {
	if (!map.has(name)) map.set(name, new Set());
	map.get(name).add(file);
}

for (const file of walk(SRC, [".css", ".svelte", ".ts"])) {
	const rel = relative(ROOT, file).replaceAll("\\", "/");
	const text = readFileSync(file, "utf8");
	if (file.endsWith(".css") || file.endsWith(".svelte")) {
		for (const m of text.matchAll(DEFINE_RE)) record(defined, m[1], rel);
		for (const m of text.matchAll(AT_PROPERTY_RE)) record(defined, m[1], rel);
		for (const m of text.matchAll(CONSUME_RE)) record(consumed, m[1], rel);
	}
	if (file.endsWith(".ts") || file.endsWith(".svelte")) {
		for (const m of text.matchAll(JS_SET_RE)) record(defined, m[1], rel);
	}
}

const isRuntimeDefined = (name) => RUNTIME_DEFINED_PREFIXES.some((p) => name.startsWith(p));

const undefinedVars = [...consumed.keys()]
	.filter((n) => !defined.has(n) && !isRuntimeDefined(n))
	.sort((a, b) => a.localeCompare(b))
	.map((n) => ({ name: n, consumers: [...consumed.get(n)] }));

const deadVars = [...defined.keys()]
	.filter((n) => !consumed.has(n))
	.sort((a, b) => a.localeCompare(b))
	.map((n) => ({ name: n, definers: [...defined.get(n)] }));

const contested = [...defined.entries()]
	.filter(([, files]) => files.size > 1)
	.sort((a, b) => b[1].size - a[1].size)
	.map(([n, files]) => ({ name: n, files: [...files] }));

const report = {
	summary: {
		definedCount: defined.size,
		consumedCount: consumed.size,
		undefinedCount: undefinedVars.length,
		deadCount: deadVars.length,
		contestedCount: contested.length,
	},
	undefined: undefinedVars,
	dead: deadVars,
	contested,
};

const jsonIdx = process.argv.indexOf("--json");
if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
	writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(report, null, "\t"));
	console.log(`[css-var-audit] JSON written: ${process.argv[jsonIdx + 1]}`);
}

const { summary } = report;
console.log("[css-var-audit] ColdLight custom-property chain");
console.log(`  defined:   ${summary.definedCount}`);
console.log(`  consumed:  ${summary.consumedCount}`);
console.log(`  UNDEFINED (consumed, never defined): ${summary.undefinedCount}`);
console.log(`  DEAD      (defined, never consumed): ${summary.deadCount}`);
console.log(`  CONTESTED (defined in 2+ files):     ${summary.contestedCount}`);
console.log("");
console.log("── UNDEFINED (broken chains — silent render failures) ──");
for (const v of undefinedVars.slice(0, 60)) {
	console.log(`  ${v.name}`);
	for (const c of v.consumers.slice(0, 3)) console.log(`      <- ${c}`);
}
if (undefinedVars.length > 60)
	console.log(`  ... and ${undefinedVars.length - 60} more (see --json)`);
console.log("");
console.log("── CONTESTED (top 25 — cascade fights) ──");
for (const v of contested.slice(0, 25)) {
	console.log(`  ${v.name}  (${v.files.length} definers)`);
	for (const f of v.files.slice(0, 4)) console.log(`      = ${f}`);
}

process.exitCode = 0;
