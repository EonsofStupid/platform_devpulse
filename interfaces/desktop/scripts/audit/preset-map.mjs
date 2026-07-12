#!/usr/bin/env node
/**
 * @file preset-map.mjs
 * @package @devpulse/coldlight
 *
 * Preset re-source mapper (Phase 2 of the FUBAR recovery, Pass 1 tooling).
 * Usage: node scripts/audit/preset-map.mjs [--json <outfile>]
 *
 * The shared preset tier (tokens/src/presets/*.tokens.json) carries ~360
 * raw oklch() literals and zero palette references — hand-flattened from
 * the retired style-presets.json, abandoning the SEED-PRESETS §21 model
 * (preset = per-axis token composition). This tool makes the restoration
 * MECHANICAL: every color literal in every preset family is matched
 * against the emitted palette/role/accent pool by CIEDE2000 distance and
 * classified:
 *
 *   EXACT (ΔE ≤ 2)  — bind the reference, zero visual change
 *   NEAR  (ΔE ≤ 6)  — bind the reference, sub-threshold visual delta
 *   SEED  (ΔE > 6)  — no palette equivalent; a family seed value that
 *                     the seed schema must parameterize (or a new token)
 *
 * Alpha is reported separately (candidate pool includes the 0.35 glow /
 * 0.08 fill alpha variants); shadows are decomposed per color layer.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { converter, differenceCiede2000, parse } from "culori";

const ROOT = process.cwd();
const PRESET_DIR = join(ROOT, "scripts/build/styledictionary/tokens/src/presets");
const deltaE = differenceCiede2000();
const toOklch = converter("oklch");

// ─── Candidate pool: emitted palette/semantic color vars ─────────────

const POOL_FILES = [
	"src/lib/design/styles/primitives/color.css",
	"src/lib/design/styles/semantic/accent.css",
	"src/lib/design/styles/semantic/role.css",
	"src/lib/design/styles/semantic/signal.css",
	"src/lib/design/styles/semantic/text.css",
];

// Value starts with a non-space char — removes the \s*/[^;{}] overlap
// that made the pattern backtrack super-linearly (Sonar S5852).
const DEF_RE = /(--[a-zA-Z0-9-]+)\s*:\s*([^;{}\s][^;{}]*);/g;

/** varName -> raw value string (may be var() chain) */
const rawDefs = new Map();
for (const rel of POOL_FILES) {
	const text = readFileSync(join(ROOT, rel), "utf8");
	for (const m of text.matchAll(DEF_RE)) rawDefs.set(m[1], m[2].trim());
}

/**
 * Hand-parse a `var(--name[, fallback])` call — the anchored regex form
 * backtracks super-linearly on long fallbacks (Sonar S5852).
 * @returns {{ name: string, fallback: string | null } | null}
 */
function parseVarCall(v) {
	if (!v.startsWith("var(") || !v.endsWith(")")) return null;
	const inner = v.slice(4, -1);
	const comma = inner.indexOf(",");
	const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
	if (!/^--[a-zA-Z0-9-]+$/.test(name)) return null;
	return { name, fallback: comma === -1 ? null : inner.slice(comma + 1).trim() };
}

function resolveVar(value, depth = 0) {
	if (depth > 16 || typeof value !== "string") return null;
	const v = value.trim();
	const varCall = parseVarCall(v);
	if (varCall) {
		const target = rawDefs.get(varCall.name);
		if (target !== undefined) return resolveVar(target, depth + 1);
		return varCall.fallback ? resolveVar(varCall.fallback, depth + 1) : null;
	}
	return parse(v) ?? null;
}

/** [{ name, color, alpha }] — opaque base + declared alpha kept separately */
const pool = [];
for (const [name, raw] of rawDefs) {
	const c = resolveVar(raw);
	if (!c) continue;
	pool.push({ name, base: { ...toOklch(c), alpha: undefined }, alpha: c.alpha ?? 1 });
}

function classify(literal) {
	const c = parse(literal);
	if (!c) return null;
	const base = { ...toOklch(c), alpha: undefined };
	const alpha = c.alpha ?? 1;

	let best = null;
	for (const cand of pool) {
		const d = deltaE(base, cand.base);
		if (best === null || d < best.dE) best = { ...cand, dE: d };
	}
	if (!best) return null;

	// Prefer an alpha-matching sibling among near-equal candidates
	// (e.g. glow α0.35 / fill α0.08 variants of the same hue).
	for (const cand of pool) {
		const d = deltaE(base, cand.base);
		if (d <= best.dE + 0.5 && Math.abs(cand.alpha - alpha) < Math.abs(best.alpha - alpha)) {
			best = { ...cand, dE: d };
		}
	}

	let verdict = "SEED";
	if (best.dE <= 2) verdict = "EXACT";
	else if (best.dE <= 6) verdict = "NEAR";
	return {
		literal,
		alpha: Number(alpha.toFixed(3)),
		candidate: best.name,
		candidateAlpha: Number(best.alpha.toFixed(3)),
		deltaE: Number(best.dE.toFixed(1)),
		verdict,
	};
}

// ─── Walk preset sources ─────────────────────────────────────────────

const OKLCH_IN_STRING = /oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.%]+)?\s*\)/g;

const rows = [];

function sweepPreset(node, path, family) {
	if (node === null || typeof node !== "object") return;
	const value = node.$value;
	if (value !== undefined) {
		const type = node.$type ?? "";
		if (typeof value === "string") {
			for (const m of value.matchAll(OKLCH_IN_STRING)) {
				const entry = classify(m[0]);
				if (entry) rows.push({ family, token: path.join("."), type, ...entry });
			}
		}
		return;
	}
	for (const [k, v] of Object.entries(node)) {
		if (k.startsWith("$")) continue;
		sweepPreset(v, [...path, k], family);
	}
}

for (const name of readdirSync(PRESET_DIR)) {
	if (!name.endsWith(".tokens.json")) continue;
	const full = join(PRESET_DIR, name);
	if (!statSync(full).isFile()) continue;
	const family = basename(name, ".tokens.json");
	try {
		sweepPreset(JSON.parse(readFileSync(full, "utf8")), [], family);
	} catch {
		console.error(`[preset-map] unparseable JSON skipped: ${name}`);
	}
}

// ─── Report ──────────────────────────────────────────────────────────

const byFamily = new Map();
for (const r of rows) {
	if (!byFamily.has(r.family)) byFamily.set(r.family, []);
	byFamily.get(r.family).push(r);
}

const summary = {};
for (const [family, list] of byFamily) {
	summary[family] = {
		literals: list.length,
		exact: list.filter((r) => r.verdict === "EXACT").length,
		near: list.filter((r) => r.verdict === "NEAR").length,
		seed: list.filter((r) => r.verdict === "SEED").length,
	};
}

const report = { poolSize: pool.length, summary, rows };

const jsonIdx = process.argv.indexOf("--json");
if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
	writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(report, null, "\t"));
	console.log(`[preset-map] JSON written: ${process.argv[jsonIdx + 1]}`);
}

console.log(`[preset-map] candidate pool: ${pool.length} palette/semantic vars`);
console.log("");
console.log("── Per-family verdicts (EXACT bind / NEAR bind / SEED parameterize) ──");
for (const [family, s] of Object.entries(summary)) {
	console.log(
		`  ${family.padEnd(8)} ${String(s.literals).padStart(3)} literals → ${s.exact} exact, ${s.near} near, ${s.seed} seed`,
	);
}
console.log("");
console.log("── SEED literals (no palette equivalent — the real family parameters) ──");
const seeds = rows.filter((r) => r.verdict === "SEED");
for (const r of seeds.slice(0, 40)) {
	console.log(
		`  ${r.family.padEnd(8)} ${r.token.split(".").slice(1).join(".").padEnd(52)} ${r.literal}  (nearest ${r.candidate} ΔE ${r.deltaE})`,
	);
}
if (seeds.length > 40) console.log(`  ... and ${seeds.length - 40} more (see --json)`);

process.exitCode = 0;
