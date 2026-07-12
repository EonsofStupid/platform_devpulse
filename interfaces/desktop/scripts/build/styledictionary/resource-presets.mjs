#!/usr/bin/env node
/**
 * @file resource-presets.mjs
 * @package @devpulse/coldlight
 *
 * Preset re-source codemod (Phase 2, SEED-PRESETS Part A §A5 step 1).
 * Usage: node scripts/build/styledictionary/resource-presets.mjs <family...>
 *        e.g. ... resource-presets.mjs glass neuro stark flat
 *
 * Consumes preset-map.json (regenerate first: pnpm audit:presetmap --json
 * scripts/build/styledictionary/preset-map.json) and rewrites EXACT + NEAR
 * color literals in tokens/src/presets/{family}.tokens.json to live
 * references:
 *
 *   - alpha matches candidate (±0.02)  → "{path}"            (pure ref)
 *   - alpha differs                    → "oklch(from {path} l c h / α)"
 *                                        (relative color — binding stays
 *                                        live, alpha stays exact)
 *
 * SEED-verdict literals are left untouched (they become family seeds in
 * the P2.5 derivation generator). Deterministic: same map + same sources
 * → same output; review via git diff; gates: ds:tokens:build (broken
 * refs THROW), audit:presetmap, audit:color, Card rendered-proof test.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MAP_PATH = join(ROOT, "scripts/build/styledictionary/preset-map.json");
const PRESET_DIR = join(ROOT, "scripts/build/styledictionary/tokens/src/presets");

const ROLE_ROOTS = new Set([
	"primary",
	"secondary",
	"danger",
	"success",
	"warning",
	"info",
	"muted",
	"cta",
	"accent",
]);

/** --var-name → {dtcg.path} or null when unmappable. */
function varToRef(name) {
	const bare = name.replace(/^--/, "");

	// --color-{hue}-{stop} | --color-white | --color-void-base
	let m = bare.match(/^color-([a-z-]+?)-(\d+)$/);
	if (m) return `{color.${m[1]}.${m[2]}}`;
	m = bare.match(/^color-([a-z-]+?)-(base)$/);
	if (m) return `{color.${m[1]}.${m[2]}}`;
	if (bare === "color-white") return "{color.white}";
	if (bare === "color-black") return "{color.black}";

	// --accent-{hue|role}-{main|glow|fill|fg}
	m = bare.match(/^accent-([a-z-]+?)-(main|glow|fill|fg)$/);
	if (m) return `{accent.${m[1]}.${m[2]}}`;
	// --accent-{main|glow|fill|fg} (role quartet)
	m = bare.match(/^accent-(main|glow|fill|fg)$/);
	if (m) return `{accent.${m[1]}}`;

	// --{role}-{main|glow|fill|fg|alt-*|deep-*}
	m = bare.match(/^([a-z]+)-([a-z-]+)$/);
	if (m && ROLE_ROOTS.has(m[1])) return `{${m[1]}.${m[2]}}`;

	// --signal-{x}, --text-{x}
	m = bare.match(/^signal-([a-z]+)$/);
	if (m) return `{signal.${m[1]}}`;
	m = bare.match(/^text-([a-z-]+)$/);
	if (m) return `{text.${m[1]}}`;

	return null;
}

function bindingFor(row) {
	const ref = varToRef(row.candidate);
	if (!ref) return null;
	if (Math.abs(row.alpha - row.candidateAlpha) <= 0.02) return ref;
	return `oklch(from ${ref} l c h / ${row.alpha})`;
}

const map = JSON.parse(readFileSync(MAP_PATH, "utf8"));
const families = process.argv.slice(2);
if (families.length === 0) {
	console.error("usage: resource-presets.mjs <family...>  (e.g. glass neuro stark flat)");
	process.exit(1);
}

for (const family of families) {
	const file = join(PRESET_DIR, `${family}.tokens.json`);
	let text = readFileSync(file, "utf8");

	const rows = map.rows.filter(
		(r) => r.family === family && (r.verdict === "EXACT" || r.verdict === "NEAR"),
	);

	// Longest literals first so shadow-string replacements can't partially
	// overlap; identical literals share one binding (map rows repeat them).
	const byLiteral = new Map();
	for (const r of rows) {
		if (!byLiteral.has(r.literal)) byLiteral.set(r.literal, r);
	}
	const literals = [...byLiteral.keys()].sort((a, b) => b.length - a.length);

	let bound = 0;
	let skipped = 0;
	for (const lit of literals) {
		const binding = bindingFor(byLiteral.get(lit));
		if (!binding) {
			skipped++;
			console.error(
				`[resource-presets] ${family}: no ref mapping for candidate ${byLiteral.get(lit).candidate} — literal left as-is: ${lit}`,
			);
			continue;
		}
		if (!text.includes(lit)) {
			skipped++;
			console.error(`[resource-presets] ${family}: literal not found (stale map?): ${lit}`);
			continue;
		}
		text = text.split(lit).join(binding);
		bound++;
	}

	writeFileSync(file, text);
	console.log(
		`[resource-presets] ${family}: ${bound} literal(s) bound, ${skipped} skipped, SEED left: ${map.rows.filter((r) => r.family === family && r.verdict === "SEED").length}`,
	);
}
