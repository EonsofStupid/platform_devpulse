/**
 * @file sys/contracts/domains/app/devforge/devforge.contract.ts
 * @description DevForge domain contracts
 */

import { defineDomain } from "../../../routing/domain.contract.js";

/** DevForge feature identifiers */
export const DEVFORGE_FEATURES = ["dashboard", "friends"] as const;

export type DevForgeFeature = (typeof DEVFORGE_FEATURES)[number];

/** DevForge domain metadata constant */
export const DEVFORGE_DOMAIN = defineDomain({
	id: "devforge",
	owner: "app/devforge",
	status: "active",
	defaultFeature: "dashboard",
	features: DEVFORGE_FEATURES,
	order: 60,
});
