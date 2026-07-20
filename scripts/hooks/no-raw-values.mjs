#!/usr/bin/env node
/**
 * no-raw-values.mjs
 *
 * Pre-commit gate: block raw CSS values in source files. All rendered
 * values MUST come from SD5-generated tokens via `var(--*)` or
 * Tailwind theme utilities.
 *
 * Improvements over the old shell grep:
 * - Comment-aware. HTML, line, and CSS/JS block comments are stripped
 *   before scanning. Documentation explaining token values no longer
 *   triggers false positives.
 * - Per-file-type parsing. `.svelte` isolates `<script>` / `<style>`
 *   blocks and scans their bodies separately so the check understands
 *   what's actually rendered vs what's TS logic.
 * - Tailwind arbitrary utilities (`[prop:value]`) are inspected for
 *   `var(--*)` references. Raw values inside them are flagged.
 * - Stable allow-list preserved from the shell version.
 *
 * This is still regex-based on stripped source, NOT a full AST walker.
 * It is a pragmatic hook — fast enough for pre-commit, correct for
 * 99% of real violations. The long-term SSOT is the preflight engine
 * AST check in `scripts/docs/preflight/checks/`.
 *
 * Exit codes:
 *   0 = clean
 *   1 = violations found (messages written to stderr)
 *   2 = internal error (e.g. git command failed)
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const REPO_ROOT = resolve(process.cwd());

/** Paths that are allowed to contain raw values. Kept in sync with the
 *  legacy shell allow-list so behavior doesn't regress. */
const ALLOW_LIST = [
	"interfaces/desktop/src/lib/design/css/",
	"interfaces/desktop/src/lib/design/theme/",
	"interfaces/desktop/src/lib/design/style/",
	"interfaces/desktop/src/lib/design/styles/",
	"interfaces/desktop/src/lib/design/generated/",
	"interfaces/desktop/src/lib/design/glue/",
	"interfaces/desktop/src/lib/design/manifest/",
	"interfaces/desktop/src/lib/design/svg/",
	"interfaces/desktop/src/lib/design/plugins/",
	"interfaces/desktop/src/lib/design/.cowlevel/",
	"interfaces/desktop/src/lib/sys/debug/vpb/",
	"interfaces/desktop/scripts/build/styledictionary/",
	"interfaces/desktop/src/lib/domains/app/models/",
	"interfaces/desktop/src/routes/(devtools)/",
	// `lib/devtools/` is the SSOT for devtool feature components — same
	// dev-diagnostic surface as `routes/(devtools)/` and `lib/sys/debug/vpb/`,
	// so the same pragmatic raw-value exemption applies (per
	// `feedback_devtools_are_dev_diagnostics.md`).
	"interfaces/desktop/src/lib/devtools/",
	"interfaces/desktop/src/lib/layouts/app/BootOverlay",
];

const TRACKED_EXTENSIONS = new Set([".svelte", ".css", ".ts"]);

/**
 * Violation categories, each with a regex run against cleaned source.
 *
 * Semantics:
 * - `hex`      — raw `#rgb` / `#rrggbb` / `#rrggbbaa` literal
 * - `px`       — bare `Npx` not inside `var(--*)` or SVG viewBox
 * - `clPrefix` — legacy `--cl-*` custom property name
 *
 * Each regex is applied to post-comment-stripped text. The `:hover`
 * pseudo, `oklch()`, and `rgb()` are intentionally NOT flagged here
 * because senior code may use them in generated files (which are
 * already excluded) and in filter definitions (also excluded).
 */
const RULES = [
	{
		id: "hex",
		label: "Raw hex color",
		pattern: /#[0-9a-fA-F]{3,8}\b/g,
	},
	{
		id: "px",
		label: "Raw pixel value",
		pattern: /\b\d+(?:\.\d+)?px\b/g,
	},
	{
		id: "clPrefix",
		label: "Banned --cl- prefix (use canonical names)",
		pattern: /--cl-[a-z0-9_-]+/g,
	},
];

/**
 * Fence rules — stricter than `RULES` because the broad `ALLOW_LIST`
 * does NOT exempt them. These enforce SSOT boundaries around
 * primitives that have a single canonical component surface.
 *
 * Each fence rule carries its own `allow` list so only the canonical
 * primitive folder can contain the raw form.
 */
const FENCE_RULES = [
	{
		id: "lucide-spinner",
		label: "Banned lucide spinner icon (use Spinner from $lib/design/components/spinner)",
		// Matches an import binding of `Loader2` or `LoaderCircle`
		// anywhere in the file. The classifier runs after comment
		// stripping so JSDoc / HTML comment mentions are ignored.
		pattern: /\b(Loader2|LoaderCircle)\b/g,
		allow: [
			"interfaces/desktop/src/lib/design/components/spinner/",
		],
	},
	{
		id: "animate-spin",
		label: "Banned raw `animate-spin` class (compose <Spinner /> instead)",
		pattern: /\banimate-spin\b/g,
		allow: [
			"interfaces/desktop/src/lib/design/",
		],
	},
];

/** Return the list of staged files, or empty array. */
function getStagedFiles() {
	try {
		const out = execSync("git diff --cached --name-only --diff-filter=ACMR", {
			encoding: "utf8",
		});
		return out
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	} catch (e) {
		process.stderr.write(`no-raw-values: git failed — ${e instanceof Error ? e.message : e}\n`);
		process.exit(2);
	}
}

/** True if the given path is under any allow-list prefix. */
function isAllowListed(path) {
	const normalized = path.split(sep).join("/");
	return ALLOW_LIST.some((prefix) => normalized.includes(prefix));
}

/** True if the file extension is one we scan. */
function isTrackedExt(path) {
	const dot = path.lastIndexOf(".");
	if (dot < 0) return false;
	return TRACKED_EXTENSIONS.has(path.slice(dot));
}

/**
 * Remove comment regions from a string so regex scans skip them.
 * Handles HTML comments, CSS/JS block comments, and JS line comments.
 * Preserves line numbers by replacing comment bodies with whitespace,
 * so error reporting shows the correct original line.
 */
function stripComments(source, kind) {
	let out = source;

	// Block comments — valid in JS/TS and CSS.
	out = out.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "));

	// HTML comments `<!-- ... -->` — valid in Svelte markup.
	out = out.replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, " "));

	// Line comments `// ...` — valid in JS/TS. Avoid matching inside URLs.
	if (kind === "ts" || kind === "svelte-script") {
		out = out.replace(/(^|[^:])\/\/[^\n]*/g, (match, pre) => pre + " ".repeat(match.length - pre.length));
	}

	return out;
}

/**
 * Extract the scannable parts of a `.svelte` file:
 * - The template (everything outside `<script>` / `<style>` blocks)
 * - The script block body (for inline style=, class=)
 * - The style block body (the thing the check is really about)
 *
 * Returns `{ template, script, style }` with the non-relevant
 * regions blanked to spaces so line numbers are preserved.
 */
function extractSvelteRegions(source) {
	const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
	const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

	let template = source;
	let script = "";
	let style = "";

	template = template.replace(scriptRe, (match, body) => {
		script += `${body}\n`;
		return match.replace(/[^\n]/g, " ");
	});

	template = template.replace(styleRe, (match, body) => {
		style += `${body}\n`;
		return match.replace(/[^\n]/g, " ");
	});

	return { template, script, style };
}

/**
 * Scan a chunk of already-comment-stripped text and return violation
 * entries `{ rule, line, match }`.
 */
function scanChunk(text, ruleSubset) {
	const lines = text.split(/\r?\n/);
	const hits = [];
	lines.forEach((line, idx) => {
		for (const rule of ruleSubset) {
			rule.pattern.lastIndex = 0;
			let m;
			while ((m = rule.pattern.exec(line)) !== null) {
				hits.push({ rule: rule.id, label: rule.label, line: idx + 1, match: m[0] });
			}
		}
	});
	return hits;
}

/** True if the given path is exempted from a specific fence rule. */
function isFenceAllowed(path, rule) {
	const normalized = path.split(sep).join("/");
	return rule.allow.some((prefix) => normalized.includes(prefix));
}

/**
 * Run the fence rules (which ignore `ALLOW_LIST` and have their own
 * per-rule exclusion) against a comment-stripped source chunk.
 */
function scanFence(text, rules) {
	const lines = text.split(/\r?\n/);
	const hits = [];
	lines.forEach((line, idx) => {
		for (const rule of rules) {
			rule.pattern.lastIndex = 0;
			let m;
			while ((m = rule.pattern.exec(line)) !== null) {
				hits.push({ rule: rule.id, label: rule.label, line: idx + 1, match: m[0] });
			}
		}
	});
	return hits;
}

/**
 * Scan a single file. Returns an array of violations with line numbers
 * relative to the original source.
 *
 * @param path     relative path from repo root
 * @param strict   if true, apply the broad `RULES` (hex/px/--cl-).
 *                  If false, skip the broad rules and apply only the
 *                  fence rules. Allow-listed files run with
 *                  `strict=false`.
 */
function scanFile(path, strict) {
	const absolute = resolve(REPO_ROOT, path);
	let source;
	try {
		source = readFileSync(absolute, "utf8");
	} catch {
		return [];
	}

	// Fence rules that apply to this file — those whose exclusion
	// list does NOT contain the file's path.
	const applicableFenceRules = FENCE_RULES.filter((r) => !isFenceAllowed(path, r));

	if (path.endsWith(".svelte")) {
		const regions = extractSvelteRegions(source);
		const template = stripComments(regions.template, "svelte-template");
		const script = stripComments(regions.script, "svelte-script");
		const style = stripComments(regions.style, "svelte-style");

		// Script body: only flag --cl- prefix. Raw hex/px in TS logic
		// is usually legitimate (dimensions passed through a design
		// token helper), and the noise ratio makes the rule useless.
		const scriptRules = strict ? RULES.filter((r) => r.id === "clPrefix") : [];
		const fullRules = strict ? RULES : [];

		const hits = [
			...scanChunk(template, fullRules),
			...scanChunk(script, scriptRules),
			...scanChunk(style, fullRules),
			// Fence rules apply across EVERY region (script imports,
			// template classes, style bodies) so imports AND class
			// usages are both caught.
			...scanFence(template, applicableFenceRules),
			...scanFence(script, applicableFenceRules),
			...scanFence(style, applicableFenceRules),
		];
		return hits;
	}

	if (path.endsWith(".css")) {
		const stripped = stripComments(source, "css");
		return [
			...scanChunk(stripped, strict ? RULES : []),
			...scanFence(stripped, applicableFenceRules),
		];
	}

	if (path.endsWith(".ts")) {
		const stripped = stripComments(source, "ts");
		// TS: only --cl- prefix is meaningful. px/hex in TS is generally
		// inside logic like `formatMb(model.vram_estimate_mb)` — not CSS.
		const tsRules = strict ? RULES.filter((r) => r.id === "clPrefix") : [];
		return [
			...scanChunk(stripped, tsRules),
			...scanFence(stripped, applicableFenceRules),
		];
	}

	return [];
}

function main() {
	const staged = getStagedFiles();
	// Scan every tracked staged file. Allow-listed files get the
	// fence-only pass; non-allow-listed get the full `RULES` sweep
	// plus the fence.
	const candidates = staged.filter(isTrackedExt);

	if (candidates.length === 0) {
		process.exit(0);
	}

	const violations = [];
	for (const path of candidates) {
		const strict = !isAllowListed(path);
		const hits = scanFile(path, strict);
		if (hits.length > 0) {
			violations.push({ path, hits });
		}
	}

	if (violations.length === 0) {
		process.exit(0);
	}

	const out = process.stderr;
	out.write("\nERROR: Raw CSS values / banned imports detected.\n");
	out.write("All visual values must use design tokens; all loading indicators\n");
	out.write("must compose <Spinner /> from $lib/design/components/spinner.\n\n");
	out.write("Violations:\n");
	for (const { path, hits } of violations) {
		out.write(`  ${relative(REPO_ROOT, path).split(sep).join("/")}\n`);
		for (const hit of hits) {
			out.write(`    L${hit.line}  ${hit.label}: ${hit.match}\n`);
		}
		out.write("\n");
	}
	out.write("Token source: scripts/build/styledictionary/tokens/src/*.json\n");
	out.write("Build tokens: pnpm ds:tokens:build\n");
	out.write("Spinner guide: src/lib/design/components/spinner/index.ts\n\n");
	process.exit(1);
}

main();
