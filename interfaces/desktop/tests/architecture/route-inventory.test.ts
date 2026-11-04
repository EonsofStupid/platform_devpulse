/**
 * The route inventory is generated from the folders: it satisfies its contract
 * and holds exactly the pages the route manifest holds.
 */

import { describe, expect, it } from "vitest";
import { RoutesInventoryContract } from "#lib/sys/contracts/index.js";
import { routesInventory } from "#lib/sys/routing/route-inventory.js";
import { pagesUnder, routeTree } from "#lib/sys/routing/route-manifest.js";

describe("route inventory", () => {
	const inventory = routesInventory();

	it("satisfies its contract", () => {
		RoutesInventoryContract.assert(inventory);
	});

	it("lists every page once", () => {
		const listed = Object.values(inventory.groups)
			.flatMap((group) => [
				...group.routes,
				...Object.values(group.hubs).flatMap((hub) => hub.routes),
			])
			.map((route) => route.path)
			.sort();
		const pages = pagesUnder(routeTree)
			.map((page) => page.path as string)
			.sort();
		expect(listed).toEqual(pages);
		expect(inventory.meta.routeCount).toBe(pages.length);
	});

	it("keeps each hub in its route group", () => {
		for (const hub of routeTree.children) {
			expect(inventory.groups[hub.group ?? "root"]?.hubs[hub.segment], hub.path).toBeDefined();
		}
	});
});
