#!/usr/bin/env node
/**
 * @file color-audit.mjs
 * @package @devpulse/coldlight
 *
 * ColdLight color-science auditor (culori-backed).
 * Usage: node scripts/audit/color-audit.mjs [--json <outfile>]
 *
 * Three checks the eye can't do reliably:
 *
 *   1. GAMUT     — emitted oklch() values outside sRGB get clamped
 *                  differently per browser; inventory them with the
 *                  nearest in-gamut chroma.
 *   2. CONTRAST  — WCAG 2.1 ratios for the load-bearing fg/bg pairs,
 *                  resolved through the emitted custom-property chains
 *                  (alpha composited over the resolved background).
 *   3. HEX DRIFT — DTCG sources carry a `hex` sRGB fallback next to the
 *                  oklch components; flag entries where the two disagree
 *                  (CIEDE2000), i.e. the fallback lies about the color.
 *
 * Var resolution approximates the cascade: primitives → semantic →
 * components → theme → app.css, last definition wins. color-mix() and
 * gradients are skipped (need a CSS engine).
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
	clampChroma,
	converter,
	differenceCiede2000,
	displayable,
	formatCss,
	formatHex,
	parse,
	wcagContrast,
} from "culori";

const ROOT = process.cwd();
const toRgb = converter("rgb");
const toOklch = converter("oklch");
const deltaE = differenceCiede2000();

/** Load-bearing pairs: [foreground var, background var, kind, threshold] */
const CONTRAST_PAIRS = [
	["--text-primary", "--color-void-base", "body text", 4.5],
	["--text-secondary", "--color-void-base", "body text", 4.5],
	["--text-muted", "--color-void-base", "body text", 4.5],
	["--primary-main", "--color-void-base", "UI component", 3],
	["--secondary-main", "--color-void-base", "UI component", 3],
	["--danger-main", "--color-void-base", "UI component", 3],
	["--success-main", "--color-void-base", "UI component", 3],
	["--warning-main", "--color-void-base", "UI component", 3],
	["--info-main", "--color-void-base", "UI component", 3],
	["--accent-muted-main", "--color-void-base", "UI component", 3],
	["--primary-fg", "--primary-main", "on-role text", 4.5],
	["--danger-fg", "--danger-main", "on-role text", 4.5],
	["--success-fg", "--success-main", "on-role text", 4.5],
	["--warning-fg", "--warning-main", "on-role text", 4.5],
];

function walk(dir, exts, acc = []) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) walk(full, exts, acc);
		else if (exts.some((e) => name.endsWith(e))) acc.push(full);
	}
	return acc;
}

// ─── Harvest custom-property definitions in cascade-ish order ────────

// Value starts with a non-space char — removes the \s*/[^;{}] overlap
// that made the pattern backtrack super-linearly (Sonar S5852).
const DEF_RE = /(--[a-zA-Z0-9-]+)\s*:\s*([^;{}\s][^;{}]*);/g;
const vars = new Map();

const CSS_SOURCES = [
	"src/lib/design/styles/primitives",
	"src/lib/design/styles/semantic",
	"src/lib/design/styles/components",
	"src/lib/design/theme",
	"src/app.css",
];

for (const src of CSS_SOURCES) {
	const full = join(ROOT, src);
	const files = statSync(full).isDirectory() ? walk(full, [".css"]) : [full];
	for (const f of files.toSorted((a, b) => a.localeCompare(b))) {
		const text = readFileSync(f, "utf8");
		for (const m of text.matchAll(DEF_RE)) {
			vars.set(m[1], m[2].trim());
		}
	}
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

/** Resolve a value through var() chains to a culori color, or null. */
function resolveColor(value, depth = 0) {
	if (depth > 32 || typeof value !== "string") return null;
	const v = value.trim();
	const varCall = parseVarCall(v);
	if (varCall) {
		const target = vars.get(varCall.name);
		if (target !== undefined) return resolveColor(target, depth + 1);
		return varCall.fallback ? resolveColor(varCall.fallback, depth + 1) : null;
	}
	if (v.includes("color-mix") || v.includes("gradient")) return null;
	const parsed = parse(v);
	return parsed ?? null;
}

/** src-over composite of fg (with alpha) onto opaque bg, in sRGB. */
function composite(fg, bg) {
	const f = toRgb(fg);
	const b = toRgb(bg);
	const a = f.alpha ?? 1;
	if (a >= 1) return f;
	return {
		mode: "rgb",
		r: f.r * a + b.r * (1 - a),
		g: f.g * a + b.g * (1 - a),
		b: f.b * a + b.b * (1 - a),
	};
}

// ─── 1. Gamut sweep over emitted oklch() literals ────────────────────

const OKLCH_RE = /oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.%]+)?\s*\)/g;
const gamutHits = new Map();

for (const src of CSS_SOURCES) {
	const full = join(ROOT, src);
	const files = statSync(full).isDirectory() ? walk(full, [".css"]) : [full];
	for (const f of files) {
		const rel = relative(ROOT, f).replaceAll("\\", "/");
		const text = readFileSync(f, "utf8");
		for (const m of text.matchAll(OKLCH_RE)) {
			const c = parse(m[0]);
			if (!c) continue;
			const opaque = { ...c, alpha: undefined };
			if (!displayable(opaque)) {
				const key = m[0];
				if (!gamutHits.has(key)) {
					const clamped = clampChroma(opaque, "oklch");
					gamutHits.set(key, {
						value: key,
						files: new Set(),
						chroma: c.c,
						inGamutChroma: Number(clamped.c.toFixed(4)),
					});
				}
				gamutHits.get(key).files.add(rel);
			}
		}
	}
}

const gamut = [...gamutHits.values()]
	.sort((a, b) => b.chroma - a.chroma)
	.map((g) => ({ ...g, files: [...g.files] }));

// ─── 2. Contrast on resolved pairs ───────────────────────────────────

const contrast = [];
for (const [fgVar, bgVar, kind, threshold] of CONTRAST_PAIRS) {
	const fgRaw = vars.get(fgVar);
	const bgRaw = vars.get(bgVar);
	const fg = fgRaw !== undefined ? resolveColor(fgRaw) : null;
	const bg = bgRaw !== undefined ? resolveColor(bgRaw) : null;
	if (!fg || !bg) {
		contrast.push({ fgVar, bgVar, kind, ratio: null, threshold, verdict: "UNRESOLVED" });
		continue;
	}
	const bgOpaque = { ...toRgb(bg), alpha: 1 };
	const fgFlat = composite(fg, bgOpaque);
	const ratio = Number(wcagContrast(fgFlat, bgOpaque).toFixed(2));
	contrast.push({
		fgVar,
		bgVar,
		kind,
		ratio,
		threshold,
		verdict: ratio >= threshold ? "PASS" : "FAIL",
	});
}

// ─── 3. DTCG hex-fallback drift ──────────────────────────────────────

const TOKEN_SRC = join(ROOT, "scripts/build/styledictionary/tokens/src");
const drift = [];

function sweepDtcg(node, path, file) {
	if (node === null || typeof node !== "object") return;
	if (
		node.colorSpace === "oklch" &&
		Array.isArray(node.components) &&
		typeof node.hex === "string"
	) {
		const [l, c, h] = node.components;
		const declared = parse(node.hex);
		const actual = { mode: "oklch", l, c, h };
		if (declared) {
			const clamped = clampChroma(actual, "oklch");
			const dE = deltaE(toOklch(declared), clamped);
			if (dE > 5) {
				drift.push({
					token: path.join("."),
					file,
					oklch: formatCss(actual),
					computedHex: formatHex(toRgb(clamped)),
					declaredHex: node.hex,
					deltaE: Number(dE.toFixed(1)),
				});
			}
		}
		return;
	}
	for (const [k, v] of Object.entries(node)) {
		if (k.startsWith("$")) continue;
		sweepDtcg(v, [...path, k], file);
	}
}

for (const f of walk(TOKEN_SRC, [".json"])) {
	const rel = relative(ROOT, f).replaceAll("\\", "/");
	try {
		sweepDtcg(JSON.parse(readFileSync(f, "utf8")), [], rel);
	} catch {
		console.error(`[color-audit] unparseable JSON skipped: ${rel}`);
	}
}
drift.sort((a, b) => b.deltaE - a.deltaE);

// ─── Report ──────────────────────────────────────────────────────────

const report = {
	summary: {
		varsHarvested: vars.size,
		outOfGamut: gamut.length,
		contrastFail: contrast.filter((c) => c.verdict === "FAIL").length,
		contrastUnresolved: contrast.filter((c) => c.verdict === "UNRESOLVED").length,
		hexDrift: drift.length,
	},
	gamut,
	contrast,
	hexDrift: drift,
};

const jsonIdx = process.argv.indexOf("--json");
if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
	writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(report, null, "\t"));
	console.log(`[color-audit] JSON written: ${process.argv[jsonIdx + 1]}`);
}

console.log("[color-audit] ColdLight color science");
console.log(`  custom properties harvested: ${vars.size}`);
console.log("");
console.log(`── GAMUT: ${gamut.length} emitted oklch() outside sRGB ──`);
for (const g of gamut.slice(0, 20)) {
	console.log(`  ${g.value}  (in-gamut C ≤ ${g.inGamutChroma})`);
	for (const f of g.files.slice(0, 2)) console.log(`      @ ${f}`);
}
console.log("");
console.log("── CONTRAST (WCAG 2.1, alpha composited) ──");
for (const c of contrast) {
	const r = c.ratio === null ? "—" : `${c.ratio}:1`;
	console.log(
		`  ${c.verdict.padEnd(10)} ${r.padStart(8)}  ${c.fgVar} on ${c.bgVar}  (${c.kind}, needs ${c.threshold}:1)`,
	);
}
console.log("");
console.log(`── HEX-FALLBACK DRIFT: ${drift.length} DTCG entries disagree (ΔE00 > 5) ──`);
for (const d of drift.slice(0, 15)) {
	console.log(`  ΔE ${String(d.deltaE).padStart(5)}  ${d.token}`);
	console.log(`      oklch ${d.oklch} → ${d.computedHex}, declared ${d.declaredHex}  (${d.file})`);
}

process.exitCode = 0;
