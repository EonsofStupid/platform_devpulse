/**
 * @file The href of a route-tree node.
 * @module @devpulse/sys/routing
 *
 * `resolve()` from `$app/paths` is typed for literal routes; a node's path is
 * a member of SvelteKit's generated `Pathname` union, held in a variable. No
 * route takes parameters (the architecture test fails if one does), so
 * `resolve`'s one-argument form is the right call for every node — it adds
 * the configured base path.
 */

import { resolve } from "$app/paths";
import type { Pathname, ResolvedPathname } from "$app/types";
import type { RouteNode } from "./route-manifest.js";

const resolvePath = resolve as (route: Pathname) => ResolvedPathname;

/** Link target for a route-tree node. */
export function hrefOf(node: RouteNode): ResolvedPathname {
	return resolvePath(node.path);
}
