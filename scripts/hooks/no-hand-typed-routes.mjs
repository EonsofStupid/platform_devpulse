#!/usr/bin/env node
/**
 * no-hand-typed-routes.mjs
 *
 * Pre-commit gate (plan 0008): the route folders under
 * `interfaces/desktop/src/routes` are the only place a route exists.
 *
 * - Lists of routes (menus, dashboards, tiles) come from the route manifest
 *   (`#lib/sys/routing`), which Vite builds from the folders.
 * - A link to one specific page uses `resolve("path")` from `$app/paths`
 *   (typed against SvelteKit's generated route list), or `routeAt("/path")`
 *   when the page's name is wanted too.
 *
 * Flags, in staged `.svelte` / `.ts` files under the desktop `src/`:
 * 1. a string route in a navigation position — `href`, `goto(`,
 *    `redirect(<status>,`, `location.assign(` / `location.href =`, a
 *    `route` prop or key — whatever path it names (dead paths included);
 * 2. any quoted string equal to a real route path (read from the folders),
 *    so a route cannot be smuggled through a variable,
 * unless the string is the argument of `resolve(` or `routeAt(`.
 * Comments are blanked out first (line numbers kept), so prose and doc
 * examples never trip it.
 *
 * `--all` checks every such file instead of the staged ones (CI, audits).
 *
 * Exit codes: 0 clean · 1 violations (stderr) · 2 internal error.
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const REPO_ROOT = process.cwd();
const SRC = "interfaces/desktop/src/";
const ROUTES_DIR = join(REPO_ROOT, "interfaces/desktop/src/routes");
const SKIP = ["interfaces/desktop/src/lib/sys/generated/"];

const inScope = (f) =>
	f.startsWith(SRC) &&
	(f.endsWith(".svelte") || f.endsWith(".ts")) &&
	!SKIP.some((s) => f.startsWith(s));

/** Staged files, or with `--all` every tracked file, in scope. */
function filesToCheck() {
	const command = process.argv.includes("--all")
		? `git ls-files -- ${SRC}`
		: "git diff --cached --name-only --diff-filter=ACMR";
	try {
		return execSync(command, { encoding: "utf8" })
			.split("\n")
			.map((f) => f.trim())
			.filter(inScope);
	} catch (error) {
		process.stderr.write(`no-hand-typed-routes: git failed: ${error.message}\n`);
		process.exit(2);
	}
}

/** URL paths of every page folder, groups dropped (as SvelteKit does). */
function routePaths(dir = ROUTES_DIR, out = new Set()) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) routePaths(full, out);
		else if (entry === "+page.svelte") {
			const segments = relative(ROUTES_DIR, dir)
				.split(sep)
				.filter((s) => s !== "" && !(s.startsWith("(") && s.endsWith(")")));
			out.add(`/${segments.join("/")}`);
		}
	}
	return out;
}

/** Replace comments with spaces, keeping newlines so line numbers hold. */
function blankComments(text) {
	const blank = (m) => m.replace(/[^\n]/g, " ");
	return text
		.replace(/<!--[\s\S]*?-->/g, blank)
		.replace(/\/\*[\s\S]*?\*\//g, blank)
		.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

const ROUTE = String.raw`\/[A-Za-z0-9._\-\[\]/]*`;
const NAV = new RegExp(
	String.raw`(?:\bhref\s*=\s*\{?\s*|\bhref\s*:\s*|\bgoto\(\s*|\bredirect\(\s*\d+\s*,\s*|location\.assign\(\s*|location\.href\s*=\s*|\broute\s*=\s*\{?\s*|\broute\s*:\s*)(["'\`])(${ROUTE})\1`,
	"g",
);
const LITERAL = new RegExp(String.raw`(["'\`])(${ROUTE})\1`, "g");
const ALLOWED_BEFORE = /\b(?:resolve|routeAt)\(\s*$/;

const routes = routePaths();
const violations = [];

for (const file of filesToCheck()) {
	let text;
	try {
		text = blankComments(readFileSync(join(REPO_ROOT, file), "utf8"));
	} catch {
		continue; // deleted or unreadable — nothing to check
	}
	const lineOf = (index) => text.slice(0, index).split("\n").length;
	const seen = new Set();
	for (const m of text.matchAll(NAV)) {
		seen.add(m.index + m[0].length - m[2].length - 2);
		violations.push(`${file}:${lineOf(m.index)}  ${m[2]}  (navigation target typed by hand)`);
	}
	for (const m of text.matchAll(LITERAL)) {
		// A bare "/" is also a path separator in code; it is a route only in
		// a navigation position, which the first pass already covers.
		if (m[2] === "/") continue;
		const path = m[2].replace(/\/$/, "");
		if (!routes.has(path) || seen.has(m.index)) continue;
		if (ALLOWED_BEFORE.test(text.slice(Math.max(0, m.index - 40), m.index))) continue;
		violations.push(`${file}:${lineOf(m.index)}  ${m[2]}  (route path typed by hand)`);
	}
}

if (violations.length > 0) {
	process.stderr.write(
		`no-hand-typed-routes: ${violations.length} hand-typed route(s)\n` +
			violations.map((v) => `  ${v}`).join("\n") +
			"\n\nRoutes are the folders under interfaces/desktop/src/routes (plan 0008).\n" +
			"  - lists of pages: build them from the route manifest (#lib/sys/routing)\n" +
			'  - a link to one page: resolve("path") from $app/paths, or routeAt("/path")\n',
	);
	process.exit(1);
}
