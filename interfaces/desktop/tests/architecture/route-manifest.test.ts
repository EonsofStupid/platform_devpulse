/**
 * The route manifest is the folder structure: every page folder on disk is in
 * the tree, nothing else is, and group folders never show in a path.
 *
 * The expected set is read from disk here, independently of the manifest's
 * own `import.meta.glob`.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
	findRoute,
	pagesUnder,
	type RouteNode,
	routeTree,
} from "$lib/sys/routing/route-manifest.js";

const ROUTES = join(__dirname, "../../src/routes");

function pageFoldersOnDisk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) pageFoldersOnDisk(full, out);
		else if (entry === "+page.svelte") out.push(dir);
	}
	return out;
}

const toPath = (folder: string): string => {
	const segments = relative(ROUTES, folder)
		.split(sep)
		.filter((s) => s !== "" && !(s.startsWith("(") && s.endsWith(")")));
	return `/${segments.join("/")}`;
};

function allNodes(node: RouteNode, out: RouteNode[] = []): RouteNode[] {
	out.push(node);
	for (const child of node.children) allNodes(child, out);
	return out;
}

describe("route manifest", () => {
	const expected = pageFoldersOnDisk(ROUTES).map(toPath).sort();
	const pages = pagesUnder(routeTree).map((n) => n.path);

	it("lists exactly the page folders on disk", () => {
		expect([...pages].sort()).toEqual(expected);
	});

	it("drops route groups from every path and keeps them in the route id", () => {
		for (const node of allNodes(routeTree)) {
			expect(node.path).not.toMatch(/\(/);
			expect(node.routeId.replace(/\/\([^)]+\)/g, "") || "/").toBe(node.path);
		}
	});

	it("holds no folder without a page at or below it", () => {
		for (const node of allNodes(routeTree)) {
			expect(pagesUnder(node).length, node.path).toBeGreaterThan(0);
		}
	});

	it("finds each page by its path", () => {
		for (const path of expected) expect(findRoute(path)?.hasPage, path).toBe(true);
	});
});
