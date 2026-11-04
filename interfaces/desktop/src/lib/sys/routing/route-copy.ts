/**
 * @file Route names from the copy catalog.
 * @module @devpulse/sys/routing
 *
 * A route's name is copy, not code: `[nav."<path>"]` in the copy catalog,
 * keyed by the path its folder gives (`RouteNode.path`), and the user's
 * `copy.toml` overrides any of them. The architecture test holds the
 * catalog's keys equal to the route tree.
 */

import { copyState } from "#lib/sys/copy/index.js";
import type { RouteCopy } from "#lib/sys/generated/bindings.js";
import type { RouteNode } from "./route-manifest.js";

/** The node's name and blurb; `undefined` until the catalog has loaded. */
export function routeCopy(node: RouteNode): RouteCopy | undefined {
	return copyState.catalog?.nav[node.path];
}
