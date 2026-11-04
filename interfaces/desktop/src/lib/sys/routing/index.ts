/**
 * @module @devpulse/sys/routing
 *
 * Routes come from the `src/routes` folders. `routeTree` is that structure,
 * generated at build; each folder declares its own facts in `_nav`.
 */

export { routeCopy } from "./route-copy.js";
export { domainOf } from "./route-domain.js";
export { hrefOf, hubHere, routeAt, routeHere } from "./route-href.js";
export { routesInventory } from "./route-inventory.js";
export {
	findRoute,
	findRouteById,
	groupOf,
	pagesUnder,
	parentOf,
	type RouteNode,
	type RoutePath,
	routeExports,
	routeTree,
	topLevelOf,
} from "./route-manifest.js";
export type { LucideIcon, RouteNav, RoutePlacement } from "./route-nav.js";
