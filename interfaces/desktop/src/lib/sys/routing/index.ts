/**
 * @module @devpulse/sys/routing
 *
 * Routes come from the `src/routes` folders. `routeTree` is that structure,
 * generated at build; each folder declares its own facts in `_nav`.
 */

export { routeCopy } from "./route-copy.js";
export {
	findRoute,
	findRouteById,
	pagesUnder,
	type RouteNode,
	routeTree,
} from "./route-manifest.js";
export type { LucideIcon, RouteNav, RoutePlacement } from "./route-nav.js";
