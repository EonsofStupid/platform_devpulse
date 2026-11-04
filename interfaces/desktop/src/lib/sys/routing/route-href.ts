/**
 * @file Route-tree nodes for links and for the page being shown.
 * @module @devpulse/sys/routing
 *
 * `resolve()` from `$app/paths` takes a route id; a node holds its own, a member
 * of SvelteKit's generated `RouteId` union. No route takes parameters (the
 * architecture test fails if one does), so `resolve`'s one-argument form is the
 * right call for every node — it drops the groups and adds the configured base
 * path.
 */

import { resolve } from "$app/paths";
import { page } from "$app/state";
import type { ResolvedPathname, RouteId } from "$app/types";
import { findRoute, findRouteById, type RouteNode, type RoutePath } from "./route-manifest.js";

// `resolve` types its argument per literal route; TypeScript cannot match a
// variable holding the whole union against that, though every member is valid.
const resolveRoute = resolve as (route: RouteId) => ResolvedPathname;

/** Link target for a route-tree node. */
export function hrefOf(node: RouteNode): ResolvedPathname {
	return resolveRoute(node.routeId);
}

/**
 * The node at a path, for a link to one specific page that also wants the
 * page's name. `path` is typed from SvelteKit's generated `Path`, so a path
 * with no route folder fails type-checking, as with `resolve()`.
 */
export function routeAt(path: RoutePath): RouteNode | undefined {
	return findRoute(path);
}

/**
 * The node of the page being shown, so a page names itself from its own
 * route folder instead of typing its name. Reactive inside `$derived`.
 */
export function routeHere(): RouteNode | undefined {
	return findRouteById(page.route.id);
}
