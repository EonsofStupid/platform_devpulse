/**
 * @file The devtools tree, read from the route folders (plan 0008).
 * @module @devpulse/devtools
 *
 * The devtools dashboard is a route folder. Its child folders are tiers,
 * theirs are buckets, theirs are the devtools — the URL `/{tier}/{bucket}/{id}`
 * is the structure. Each folder's `_devtool` export adds the devtools-only
 * facts (`devtool-nav.ts`); icons and order are its `_nav`; every text is copy.
 * Pages find their own place with `page.route.id`; nothing names a route.
 */

import {
	findRouteById,
	pagesUnder,
	parentOf,
	type RouteNode,
	routeExports,
	topLevelOf,
} from "#lib/sys/routing/route-manifest.js";
import type { DevtoolNav } from "./devtool-nav.js";

const DEVTOOL_BY_ID = routeExports<DevtoolNav>("_devtool");

/** A folder's devtools-only facts (empty when it declares none). */
export function devtoolNav(node: RouteNode): DevtoolNav {
	return DEVTOOL_BY_ID.get(node.routeId) ?? {};
}

/** A bucket and its devtools, in folder order. */
export interface DevtoolBucket {
	node: RouteNode;
	tools: RouteNode[];
}

/** A tier and its buckets, in folder order. */
export interface DevtoolTier {
	node: RouteNode;
	buckets: DevtoolBucket[];
}

/** The tiers under a dashboard folder; tiers and buckets without devtools drop out. */
export function devtoolTiers(dashboard: RouteNode): DevtoolTier[] {
	return dashboard.children
		.map((tier) => ({
			node: tier,
			buckets: tier.children
				.map((bucket) => ({ node: bucket, tools: bucket.children.filter((t) => t.hasPage) }))
				.filter((bucket) => bucket.tools.length > 0),
		}))
		.filter((tier) => tier.buckets.length > 0);
}

/** Every devtool page under a dashboard folder. */
export function devtoolPages(dashboard: RouteNode): RouteNode[] {
	return devtoolTiers(dashboard).flatMap((tier) => tier.buckets.flatMap((b) => b.tools));
}

/** Where a devtool page sits: itself, its bucket, and the dashboard it belongs to. */
export interface DevtoolPlace {
	node: RouteNode;
	/** The folder above the page, unless that is the dashboard (tier pages). */
	bucket: RouteNode | undefined;
	dashboard: RouteNode;
}

/** The place of the page with this route id (`page.route.id`). */
export function devtoolPlace(routeId: string | null): DevtoolPlace | undefined {
	const node = findRouteById(routeId);
	if (!node) return undefined;
	const dashboard = topLevelOf(node);
	const parent = parentOf(node);
	return { node, bucket: parent && parent !== dashboard ? parent : undefined, dashboard };
}

/** The devtool page under a dashboard that documents a runtime. */
export function devtoolForRuntime(dashboard: RouteNode, runtimeId: string): RouteNode | undefined {
	return pagesUnder(dashboard).find((n) => devtoolNav(n).runtimeId === runtimeId);
}
