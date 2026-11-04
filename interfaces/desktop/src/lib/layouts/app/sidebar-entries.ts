/**
 * @file Sidebar entries — read from the route folders (plan 0008).
 * @module @devpulse/layouts/app
 *
 * The sidebar serves one route group (the one its layout belongs to, taken
 * from the current page's route id):
 * - hubs   — the group's top-level pages, unless they say otherwise in `_nav`
 *            or their contract's status is `hidden`
 * - footer — pages anywhere in the group whose `_nav.placement` is `footer`
 * - submenu — a hub's child pages, except `hidden` ones
 * Order and icons are each folder's own `_nav`; names come from the copy
 * catalog. Nothing here names a route.
 */

import {
	domainOf,
	pagesUnder,
	type RouteNode,
	routeTree,
	topLevelOf,
} from "#lib/sys/routing/index.js";

const inGroup = (node: RouteNode, group: string | null): boolean =>
	group !== null && node.group === group;

/** The group's hubs, in folder order. */
export function hubEntries(group: string | null): RouteNode[] {
	return routeTree.children.filter(
		(n) =>
			inGroup(n, group) &&
			n.hasPage &&
			(n.nav.placement ?? "primary") === "primary" &&
			domainOf(n)?.status !== "hidden",
	);
}

/** Pages of the group pinned below the hubs. */
export function footerEntries(group: string | null): RouteNode[] {
	return pagesUnder(routeTree).filter((n) => inGroup(n, group) && n.nav.placement === "footer");
}

/** A hub's submenu: its child pages that are not hidden. */
export function submenuOf(hub: RouteNode): RouteNode[] {
	return hub.children.filter((n) => n.hasPage && n.nav.placement !== "hidden");
}

/** Whether `node` is a hub its contract says is coming soon. */
export function isComingSoon(node: RouteNode): boolean {
	return topLevelOf(node) === node && domainOf(node)?.status === "coming-soon";
}

/** Whether `node` is the page at `pathname` or one of its ancestors. */
export function isActiveRoute(node: RouteNode, pathname: string): boolean {
	return pathname === node.path || pathname.startsWith(`${node.path}/`);
}
