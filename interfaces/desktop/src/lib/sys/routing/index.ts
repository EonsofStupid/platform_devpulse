/**
 * @module @devpulse/sys/routing
 *
 * Routes come from the `src/routes` folders. `routeTree` is that structure,
 * generated at build; each folder declares its own facts in `_nav`.
 */

export { routeCopy } from "./route-copy.js";
export { hrefOf } from "./route-href.js";
export {
	exportsByRouteId,
	findRoute,
	findRouteById,
	pagesUnder,
	parentOf,
	type RouteNode,
	routeTree,
	topLevelOf,
} from "./route-manifest.js";
export type { LucideIcon, RouteNav, RoutePlacement } from "./route-nav.js";
