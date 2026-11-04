/**
 * Every route folder has a name in the copy catalog, and every name in the
 * catalog belongs to a route folder. Names live in the engine's bundled copy
 * (`[nav."<path>"]`), keyed by the path the route manifest gives.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "smol-toml";
import { describe, expect, it } from "vitest";
import { type RouteNode, routeTree } from "#lib/sys/routing/route-manifest.js";

const COPY = join(__dirname, "../../../../systems/devpulse-engine/config/copy.default.toml");

type NavEntry = { label?: unknown; blurb?: unknown };

function allPaths(node: RouteNode, out: string[] = []): string[] {
	out.push(node.path);
	for (const child of node.children) allPaths(child, out);
	return out;
}

describe("route names", () => {
	const nav = (parse(readFileSync(COPY, "utf8")).nav ?? {}) as Record<string, NavEntry>;
	const routes = allPaths(routeTree).sort();
	const named = Object.keys(nav).sort();

	it("names every route folder", () => {
		expect(routes.filter((p) => !(p in nav))).toEqual([]);
	});

	it("names nothing that is not a route folder", () => {
		expect(named.filter((p) => !routes.includes(p))).toEqual([]);
	});

	it("gives each name a label", () => {
		for (const [path, entry] of Object.entries(nav)) {
			expect(typeof entry.label === "string" && entry.label.trim() !== "", path).toBe(true);
		}
	});
});
