/**
 * @file The route inventory — route groups, their hubs, each hub's pages.
 * @module @devpulse/sys/routing
 *
 * The hub-aware view the owner's `routes.inventory.json` gave, generated from
 * the route tree: nothing here names a route. A hub is a top-level folder, as
 * it was in the owner's routes registry; names and lines are copy.
 */

import type {
	RouteGroupInventory,
	RouteInventoryItem,
	RoutesInventory,
} from "#lib/sys/contracts/index.js";
import { routeCopy } from "./route-copy.js";
import { pagesUnder, type RouteNode, routeTree } from "./route-manifest.js";

function itemOf(node: RouteNode, isIndex: boolean): RouteInventoryItem {
	const copy = routeCopy(node);
	return {
		path: node.path,
		label: copy?.label ?? node.segment,
		isIndex,
		...(copy?.description ? { description: copy.description } : {}),
	};
}

/** Every page in the app, by route group and hub. Reactive inside `$derived`. */
export function routesInventory(): RoutesInventory {
	const groups: Record<string, RouteGroupInventory> = {};
	const groupFor = (name: string): RouteGroupInventory => {
		groups[name] ??= { label: name.replace(/[()]/g, ""), hubs: {}, routes: [] };
		return groups[name];
	};

	for (const hub of routeTree.children) {
		const group = groupFor(hub.group ?? "root");
		const copy = routeCopy(hub);
		group.hubs[hub.segment] = {
			label: copy?.label ?? hub.segment,
			...(copy?.description ? { description: copy.description } : {}),
			routes: pagesUnder(hub).map((page) => itemOf(page, page === hub)),
		};
	}
	if (routeTree.hasPage) groupFor("root").routes.push(itemOf(routeTree, true));

	return { groups, meta: { routeCount: pagesUnder(routeTree).length } };
}
