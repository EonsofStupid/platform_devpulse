/**
 * @file sys/contracts/domains/app/latest/latest.contract.ts
 * @description Latest domain contracts
 *
 * A hub that came after the owner's six, in their shape: every sidebar hub
 * has a contract, and the architecture test holds it to that.
 */

import { defineDomain } from "../../../routing/domain.contract.js";

/** Latest feature identifiers */
export const LATEST_FEATURES = ["latest-update-card"] as const;

export type LatestFeature = (typeof LATEST_FEATURES)[number];

/** Latest domain metadata constant */
export const LATEST_DOMAIN = defineDomain({
	id: "latest",
	owner: "app/updates",
	status: "active",
	features: LATEST_FEATURES,
	order: 10,
});
