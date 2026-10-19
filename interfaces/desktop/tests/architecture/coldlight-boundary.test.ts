/**
 * ColdLight is the bottom layer: it imports nothing from the app — no
 * domain, `sys`, layout, devtool or route module (docs/platform/Desktop.md
 * §1.1.1, COMPOSITION-CONTRACT.md, ColdLight's CLAUDE.md ADR-001; plan 0006
 * "ColdLight's package boundary").
 *
 * Since plan 0006 C2, ColdLight is the workspace package `@devpulse/coldlight`
 * (`packages/coldlight/`): its own modules import each other through
 * `#coldlight/*`, and the app imports it only through the package's `exports`.
 * Its own typecheck already fails on an app alias (it maps none); this test
 * also catches relative paths that climb out of either side.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const DESKTOP = resolve(__dirname, "../..");
const COLDLIGHT_ROOT = resolve(DESKTOP, "../../packages/coldlight");

/** Static, side-effect and dynamic import specifiers. */
const SPECIFIER = /(?:from\s+|import\s*\(\s*|import\s+)(["'])([^"']+)\1/g;

/** The app's path aliases (SvelteKit `$lib`, `$app`, `$env`, Node `#lib`). */
const APP_ALIAS = /^(\$lib|\$app|\$env|#lib)(\/|$)/;

function sourceFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== "node_modules" && entry.name !== ".cowlevel") sourceFiles(full, out);
		} else if (/\.(ts|js|mjs|svelte)$/.test(entry.name)) {
			out.push(full);
		}
	}
	return out;
}

function specifiers(file: string): string[] {
	return [...readFileSync(file, "utf8").matchAll(SPECIFIER)].map((m) => m[2]);
}

const inside = (root: string, path: string) => path === root || path.startsWith(root + sep);
const shown = (root: string, file: string) => relative(root, file).split(sep).join("/");

function importsLeavingColdLight(): string[] {
	const found = new Set<string>();
	for (const file of sourceFiles(COLDLIGHT_ROOT)) {
		for (const specifier of specifiers(file)) {
			const climbsOut =
				specifier.startsWith(".") && !inside(COLDLIGHT_ROOT, resolve(dirname(file), specifier));
			if (APP_ALIAS.test(specifier) || climbsOut)
				found.add(`${shown(COLDLIGHT_ROOT, file)} -> ${specifier}`);
		}
	}
	return [...found].sort();
}

function appImportsBypassingThePackage(): string[] {
	const found = new Set<string>();
	// `scripts/` joins when ColdLight's token pipeline moves into the package (plan 0006 C2c).
	for (const dir of ["src", "tests", ".storybook"]) {
		for (const file of sourceFiles(join(DESKTOP, dir))) {
			for (const specifier of specifiers(file)) {
				const intoColdLight =
					specifier.startsWith(".") && inside(COLDLIGHT_ROOT, resolve(dirname(file), specifier));
				if (intoColdLight || specifier.startsWith("$lib/design"))
					found.add(`${shown(DESKTOP, file)} -> ${specifier}`);
			}
		}
	}
	return [...found].sort();
}

describe("ColdLight boundary", () => {
	it("imports nothing from the app", () => {
		expect(importsLeavingColdLight()).toEqual([]);
	});

	it("is reached by the app only through @devpulse/coldlight", () => {
		expect(appImportsBypassingThePackage()).toEqual([]);
	});
});
