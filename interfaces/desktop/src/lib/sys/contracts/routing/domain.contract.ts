/**
 * @file sys/contracts/routing/domain.contract.ts
 * @module @devpulse/sys/contracts/routing
 * @description Domain metadata contracts for dynamic routing
 *
 * Metadata only (SPRINT-01B lock 5). A hub's route is its folder, its name is
 * copy and its icon is the folder's `_nav` (plan 0008); this contract holds
 * what a folder cannot say about itself.
 */

import { type } from "arktype";
import type { Registry } from "../registry/registry.contract.js";

export const DomainStatusContract = type("'active' | 'coming-soon' | 'hidden'");

/** Domain status for navigation */
export type DomainStatus = typeof DomainStatusContract.infer;

/** Domain metadata for registry (sidebar metadata only - URL-driven routing) */
export const DomainMetadataContract = type({
	/** Domain identifier (e.g., "devpulse") - matches route path */
	id: "string > 0",
	/** The folder under `lib/domains` that owns this hub (e.g., "app/devpulse") */
	owner: "string > 0",
	/** Domain status */
	status: DomainStatusContract,
	/** Default feature to show */
	"defaultFeature?": "string > 0",
	/** The hub's features: its `feature/` folders and feature routes */
	features: "string[]",
	/** Order in navigation (lower = first); the folder's `_nav.order` reads this */
	order: "number",
}).narrow(
	(domain, ctx) =>
		domain.defaultFeature === undefined ||
		domain.features.includes(domain.defaultFeature) ||
		ctx.mustBe("a domain whose defaultFeature is one of its features"),
);

/** A validated hub, as declared: its id stays a literal and its features a tuple. */
export type DomainMetadata = Readonly<
	Omit<typeof DomainMetadataContract.infer, "features"> & { features: readonly string[] }
>;

/** Validates a hub's metadata where it is declared, keeping its literal types. */
export function defineDomain<const T extends DomainMetadata>(metadata: T): T {
	DomainMetadataContract.assert(metadata);
	return metadata;
}

/** Domain registry interface */
export interface DomainRegistry extends Registry<DomainMetadata> {
	/** Get all active domains sorted by order */
	getActive(): DomainMetadata[];
	/** Get domains by status */
	getByStatus(status: DomainStatus): DomainMetadata[];
	/** Get all visible domains (active + coming-soon) */
	getVisible(): DomainMetadata[];
}
