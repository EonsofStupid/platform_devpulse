/**
 * @file sys/contracts/domains/app/clyffy/clyffy.contract.ts
 * @description Clyffy domain contracts
 *
 * The owner's Maestro contract, renamed with the domain (`9243ab9a`). Clyffy is
 * the one persona and the one dashboard, so there is no separate Maestro hub.
 */

import { defineDomain } from "../../../routing/domain.contract.js";

/** Clyffy domain metadata constant */
export const CLYFFY_DOMAIN = defineDomain({
	id: "clyffy",
	owner: "clyffy",
	status: "active",
	features: [],
	order: 70,
});
