/**
 * @file sys/contracts/routing/routes.contract.ts
 * @module @devpulse/sys/contracts/routing
 * @description The shape of the route inventory: route groups, hubs, pages
 *
 * Generated from the route folders by `sys/routing/route-inventory.ts`; nothing
 * types a route here (plan 0008). What a single route carries is `RouteNode`,
 * a route's link is `resolve()`, and the architecture test fails on a route
 * that takes parameters, so this file no longer describes those.
 */

import { type } from "arktype";

/** Route inventory item for navigation */
export const RouteInventoryItemContract = type({
	path: "string > 0",
	label: "string",
	"isIndex?": "boolean",
	"description?": "string",
});

export type RouteInventoryItem = typeof RouteInventoryItemContract.infer;

/** Hub metadata for navigation grouping, with the hub's pages */
export const HubMetadataContract = type({
	label: "string",
	"description?": "string",
	routes: RouteInventoryItemContract.array(),
});

export type HubMetadata = typeof HubMetadataContract.infer;

/** Route group in inventory */
export const RouteGroupInventoryContract = type({
	label: "string > 0",
	hubs: { "[string]": HubMetadataContract },
	routes: RouteInventoryItemContract.array(),
});

export type RouteGroupInventory = typeof RouteGroupInventoryContract.infer;

/** Complete routes inventory structure */
export const RoutesInventoryContract = type({
	groups: { "[string]": RouteGroupInventoryContract },
	meta: { routeCount: "number" },
});

export type RoutesInventory = typeof RoutesInventoryContract.infer;
