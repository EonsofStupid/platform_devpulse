#!/usr/bin/env node
/**
 * coldlight-boundary.mjs
 *
 * Full-tree ratchet gate for the ColdLight / Tailwind boundary:
 *
 *   Tailwind owns LAYOUT + STRUCTURE only (spacing, sizing, flex/grid,
 *   position, display, overflow, breakpoints/containers). Every VISUAL
 *   property is ColdLight's, applied through ColdLight tokens and the
 *   anatomy data attributes (data-kind / data-slot / data-state) —
 *   CUBE CSS layers: Tailwind = Composition + Utility, ColdLight =
 *   Block + Exception.
 *
 * Rules (each counted across the whole frontend tree):
 *
 *   undefined-var       `var(--x)` with no fallback, where `--x` is not
 *                       declared anywhere in src and is not a Tailwind
 *                       layout namespace (`--spacing`, `--breakpoint-*`,
 *                       `--container-*`) or Tailwind internal (`--tw-*`).
 *                       Checked in authored AND generated files.
 *   tailwind-visual     A Tailwind VISUAL utility in markup or a recipe
 *                       (bg-*, text-<size|color>, font-*, border*, rounded*,
 *                       shadow-*, ring-*, blur-*, opacity-*, tracking-*,
 *                       leading-*, transition/animate-*, …).
 *   visual-theme-token  A non-layout custom property emitted into a
 *                       Tailwind `@theme` file (src/lib/design/theme/),
 *                       which is what makes visual utilities exist.
 *   raw-value           A literal color (#hex, rgb(), hsl(), oklch(), …)
 *                       or px length authored outside the generated token
 *                       outputs, including Tailwind arbitrary values.
 *
 * Ratchet: counts are compared against `coldlight-boundary.baseline.json`.
 * Any count ABOVE baseline fails. The baseline may only go DOWN; the
 * end state is zero for every rule.
 *
 * Usage (from repo root):
 *   node scripts/hooks/coldlight-boundary.mjs            # gate (exit 1 on regression)
 *   node scripts/hooks/coldlight-boundary.mjs --update   # lower baseline to current counts
 *   node scripts/hooks/coldlight-boundary.mjs --report [rule]   # file:line listing
 *
 * Regex-based on comment-stripped source, not an AST. Limits are stated
 * per rule above; the long-term home is the preflight AST engine.
 *
 * Exit codes: 0 = no regression, 1 = regression / refused update, 2 = internal error.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const SRC = join(REPO_ROOT, "interfaces", "desktop", "src");
const BASELINE_PATH = join(HERE, "coldlight-boundary.baseline.json");

/** Generated token outputs — the only place literal values may live in src. */
const GENERATED_DIRS = [
	"lib/design/styles/",
	"lib/design/theme/",
	"lib/design/types/",
	"lib/design/generated/",
	"lib/design/.cowlevel/",
	"lib/sys/generated/",
];
const THEME_DIR = "lib/design/theme/";
const RECIPES_DIR = "lib/design/recipes/";

const RULES = ["undefined-var", "tailwind-visual", "visual-theme-token", "raw-value"];

/** Tailwind namespaces that belong to layout/structure. */
const LAYOUT_NAMESPACE = /^--(spacing(-[\w.-]+)?|breakpoint-[\w-]+|container-[\w-]+|tw-[\w-]+)$/;

/** Tailwind utilities that set visual properties (checked after stripping variants). */
const VISUAL_UTILITY = [
	/^(bg|from|via|to)-/,
	/^text-(?!(left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$)/,
	/^font-/,
	/^(shadow|inset-shadow|drop-shadow|ring|inset-ring|outline)(-|$)/,
	/^border(?!-(collapse|separate|spacing)\b)(-|$)/,
	/^(rounded|divide)(-|$)/,
	/^(blur|backdrop|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|filter)(-|$)/,
	/^opacity-/,
	/^(tracking|leading|decoration)-/,
	/^(underline|overline|line-through|no-underline|italic|not-italic|uppercase|lowercase|capitalize|normal-case|antialiased|subpixel-antialiased)$/,
	/^(fill|stroke|accent|caret|placeholder|selection)-/,
	/^(transition|duration|ease|delay|animate)(-|$)/,
	/^(mix-blend|bg-blend)-/,
];

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(\s*[\d.]/g;
const PX_LITERAL = /(?<![\w.-])(?:\d*\.)?\d+px\b/g;

// ── file walking ────────────────────────────────────────────────

function walk(dir) {
	return readdirSync(dir, { recursive: true, withFileTypes: true })
		.filter((d) => d.isFile() && /\.(svelte|css|ts|js)$/.test(d.name))
		.map((d) => join(d.parentPath ?? d.path, d.name));
}

const rel = (abs) => relative(SRC, abs).split(sep).join("/");
const isGenerated = (r) => GENERATED_DIRS.some((d) => r.startsWith(d)) || /\.generated\.[a-z]+$/.test(r);
/** Third-party doc assets — not part of the rendered app. */
const isVendored = (r) => r.startsWith("lib/design/.cowlevel/");

/** Strip block, line and HTML comments while keeping line numbers intact. */
function stripComments(text) {
	const blank = (m) => m.replace(/[^\n]/g, " ");
	return text
		.replace(/<!--[\s\S]*?-->/g, blank)
		.replace(/\/\*[\s\S]*?\*\//g, blank)
		.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/** Regions of a .svelte file that render CSS: <style> bodies and style attributes. */
function svelteCssRegions(text) {
	const regions = [];
	for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
		regions.push({ start: m.index + m[0].indexOf(m[1]), body: m[1] });
	}
	for (const m of text.matchAll(/\bstyle(?::[\w-]+)?\s*=\s*(["'])([\s\S]*?)\1/g)) {
		regions.push({ start: m.index + m[0].indexOf(m[2]), body: m[2] });
	}
	return regions;
}

/** Class tokens from class="…", class={…} literals, class: directives, cn()/clsx() literals. */
function classTokens(text, wholeFileIsClasses) {
	const out = [];
	const pushLiteralTokens = (body, base) => {
		for (const lit of body.matchAll(/(["'`])([^"'`]*?)\1/g)) {
			for (const t of lit[2].matchAll(/[^\s]+/g)) {
				out.push({ token: t[0], index: base + lit.index + 1 + t.index });
			}
		}
	};
	if (wholeFileIsClasses) {
		pushLiteralTokens(text, 0);
		return out;
	}
	for (const m of text.matchAll(/\bclass\s*=\s*(["'])([^"']*)\1/g)) {
		const base = m.index + m[0].indexOf(m[2]);
		for (const t of m[2].matchAll(/[^\s{}]+/g)) out.push({ token: t[0], index: base + t.index });
	}
	for (const m of text.matchAll(/\bclass\s*=\s*\{([^}]*)\}/g)) pushLiteralTokens(m[1], m.index + m[0].indexOf(m[1]));
	for (const m of text.matchAll(/\b(?:cn|clsx|cx)\(([^)]*)\)/g)) pushLiteralTokens(m[1], m.index + m[0].indexOf(m[1]));
	for (const m of text.matchAll(/\bclass:([^\s=>/]+)/g)) out.push({ token: m[1], index: m.index + 6 });
	return out;
}

function isVisualUtility(token) {
	const base = token.split(":").pop().replace(/^!/, "").replace(/^-/, "");
	if (!base || base.startsWith("[")) return false;
	return VISUAL_UTILITY.some((re) => re.test(base));
}

// ── scan ────────────────────────────────────────────────────────

function scan() {
	const files = walk(SRC).map((abs) => ({ abs, r: rel(abs), text: stripComments(readFileSync(abs, "utf8")) }));

	// Declared custom properties anywhere in src (CSS, style blocks, style:--x, TS keys, setProperty).
	const declared = new Set();
	for (const { text } of files) {
		for (const m of text.matchAll(/(?:^|[^\w(-])(--[\w-]+)\s*:/gm)) declared.add(m[1]);
		for (const m of text.matchAll(/style:(--[\w-]+)/g)) declared.add(m[1]);
		for (const m of text.matchAll(/["'`](--[\w-]+)["'`]\s*[:,)]/g)) declared.add(m[1]);
	}

	const hits = Object.fromEntries(RULES.map((r) => [r, []]));
	const add = (rule, r, text, index, detail) => hits[rule].push({ file: r, line: lineOf(text, index), detail });

	for (const { r, text } of files) {
		const generated = isGenerated(r);
		const isSvelte = r.endsWith(".svelte");
		const isCss = r.endsWith(".css");

		// undefined-var — authored AND generated: stale generated output referencing a
		// renamed/deleted token is exactly the drift this rule exists to catch.
		if (!isVendored(r)) {
			for (const m of text.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
				const name = m[1];
				if (m[2] || declared.has(name) || LAYOUT_NAMESPACE.test(name)) continue;
				add("undefined-var", r, text, m.index, name);
			}
		}

		// visual-theme-token
		if (r.startsWith(THEME_DIR) && isCss) {
			for (const m of text.matchAll(/(?:^|[^\w(-])(--[\w-]+)\s*:/gm)) {
				if (!LAYOUT_NAMESPACE.test(m[1])) add("visual-theme-token", r, text, m.index, m[1]);
			}
		}

		// tailwind-visual + raw values inside arbitrary utilities
		if (!generated && (isSvelte || (r.startsWith(RECIPES_DIR) && r.endsWith(".ts")))) {
			for (const { token, index } of classTokens(text, !isSvelte)) {
				if (isVisualUtility(token)) add("tailwind-visual", r, text, index, token);
				const arbitrary = token.match(/\[([^\]]+)\]/);
				if (arbitrary && !/var\(/.test(arbitrary[1]) && (/#[0-9a-fA-F]{3,8}\b/.test(arbitrary[1]) || /\d+px\b/.test(arbitrary[1]))) {
					add("raw-value", r, text, index, token);
				}
			}
		}

		// raw-value in authored CSS
		if (!generated && (isSvelte || isCss)) {
			const regions = isSvelte ? svelteCssRegions(text) : [{ start: 0, body: text }];
			for (const { start, body } of regions) {
				for (const re of [COLOR_LITERAL, PX_LITERAL]) {
					for (const m of body.matchAll(re)) {
						if (m[0] === "0px") continue;
						add("raw-value", r, text, start + m.index, m[0]);
					}
				}
			}
		}
	}
	return hits;
}

// ── report / gate ───────────────────────────────────────────────

function counts(hits) {
	return Object.fromEntries(RULES.map((r) => [r, hits[r].length]));
}

function readBaseline() {
	if (!existsSync(BASELINE_PATH)) return null;
	return JSON.parse(readFileSync(BASELINE_PATH, "utf8")).counts;
}

function writeBaseline(c) {
	const body = {
		$comment: "Ratchet for scripts/hooks/coldlight-boundary.mjs — counts may only go down; target is 0 for every rule.",
		counts: c,
	};
	writeFileSync(BASELINE_PATH, `${JSON.stringify(body, null, "\t")}\n`);
}

function main() {
	if (!existsSync(SRC)) {
		console.error(`coldlight-boundary: source dir not found: ${SRC}`);
		return 2;
	}
	const args = process.argv.slice(2);
	const hits = scan();
	const current = counts(hits);

	if (args[0] === "--report") {
		const only = args[1];
		for (const rule of RULES) {
			if (only && rule !== only) continue;
			console.log(`\n== ${rule} (${hits[rule].length})`);
			for (const h of hits[rule]) console.log(`${h.file}:${h.line}  ${h.detail}`);
		}
		return 0;
	}

	const baseline = readBaseline();

	if (args[0] === "--update") {
		if (baseline) {
			const raised = RULES.filter((r) => current[r] > (baseline[r] ?? 0));
			if (raised.length) {
				console.error(`coldlight-boundary: refusing to RAISE baseline for: ${raised.join(", ")}`);
				return 1;
			}
		}
		writeBaseline(current);
		console.log(`coldlight-boundary: baseline written ${JSON.stringify(current)}`);
		return 0;
	}

	if (!baseline) {
		console.error("coldlight-boundary: no baseline — run with --update once to record the starting counts.");
		return 1;
	}

	let failed = false;
	for (const rule of RULES) {
		const was = baseline[rule] ?? 0;
		const now = current[rule];
		const mark = now > was ? "REGRESSION" : now < was ? "improved" : "ok";
		console.log(`  ${rule.padEnd(20)} ${String(now).padStart(5)}  (baseline ${was})  ${mark}`);
		if (now > was) failed = true;
	}
	if (failed) {
		console.error("\ncoldlight-boundary: new boundary violations. List them with:\n  node scripts/hooks/coldlight-boundary.mjs --report <rule>");
		return 1;
	}
	if (RULES.some((r) => current[r] < (baseline[r] ?? 0))) {
		console.log("\ncoldlight-boundary: counts dropped — lock it in with --update.");
	}
	return 0;
}

try {
	process.exit(main());
} catch (err) {
	console.error(`coldlight-boundary: internal error: ${err?.stack ?? err}`);
	process.exit(2);
}
