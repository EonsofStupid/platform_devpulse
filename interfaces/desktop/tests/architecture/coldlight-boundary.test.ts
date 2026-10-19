/**
 * ColdLight is the bottom layer: it imports nothing from the app — no
 * domain, `sys`, layout, devtool or route module (docs/platform/Desktop.md
 * §1.1.1, COMPOSITION-CONTRACT.md, design/CLAUDE.md ADR-001; plan 0006
 * "ColdLight's package boundary").
 *
 * Plan 0006 C1 moved the last 22 such imports out of ColdLight, so the rule
 * has no exceptions.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_LIB = resolve(__dirname, "../../src/lib");
const COLDLIGHT_ROOT = join(SRC_LIB, "design");

/** Static, side-effect and dynamic import specifiers. */
const SPECIFIER = /(?:from\s+|import\s*\(\s*|import\s+)(["'])([^"']+)\1/g;

function sourceFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== "node_modules") sourceFiles(full, out);
		} else if (/\.(ts|js|mjs|svelte)$/.test(entry.name)) {
			out.push(full);
		}
	}
	return out;
}

/** Where a specifier points on disk, or `undefined` for a package import. */
function target(file: string, specifier: string): string | undefined {
	if (specifier.startsWith("$lib/")) return join(SRC_LIB, specifier.slice("$lib/".length));
	if (specifier.startsWith(".")) return resolve(dirname(file), specifier);
	return undefined;
}

function importsLeavingColdLight(): string[] {
	const found = new Set<string>();
	for (const file of sourceFiles(COLDLIGHT_ROOT)) {
		const text = readFileSync(file, "utf8");
		for (const match of text.matchAll(SPECIFIER)) {
			const specifier = match[2];
			const to = target(file, specifier);
			if (to !== undefined && !to.startsWith(COLDLIGHT_ROOT + sep)) {
				const from = relative(COLDLIGHT_ROOT, file).split(sep).join("/");
				found.add(`${from} -> ${specifier}`);
			}
		}
	}
	return [...found].sort();
}

describe("ColdLight boundary", () => {
	it("imports nothing from the app", () => {
		expect(importsLeavingColdLight()).toEqual([]);
	});
});
