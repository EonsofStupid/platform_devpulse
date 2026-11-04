/**
 * @file Which hub contract owns a route.
 * @module @devpulse/sys/routing
 *
 * A hub contract's id is its route folder's name, which the architecture test
 * holds, so the folder a page sits under finds the contract that owns it.
 */

import type { DomainMetadata } from "#lib/sys/contracts/index.js";
import { domainRegistry } from "#lib/sys/registries/routing/domain.registry.js";
import { type RouteNode, topLevelOf } from "./route-manifest.js";

/** The contract of the hub a route belongs to; `undefined` outside any hub. */
export function domainOf(node: RouteNode): DomainMetadata | undefined {
	return domainRegistry.get(topLevelOf(node).segment);
}
