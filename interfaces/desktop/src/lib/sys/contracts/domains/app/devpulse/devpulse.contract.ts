/**
 * @file sys/contracts/domains/app/devpulse/devpulse.contract.ts
 * @description DevPulse domain contracts
 */

import { defineDomain } from "../../../routing/domain.contract.js";

/** DevPulse feature identifiers */
export const DEVPULSE_FEATURES = ["dashboard", "community", "profile", "settings"] as const;

export type DevPulseFeature = (typeof DEVPULSE_FEATURES)[number];

/** DevPulse domain metadata constant */
export const DEVPULSE_DOMAIN = defineDomain({
	id: "devpulse",
	owner: "app/devpulse",
	status: "active",
	defaultFeature: "dashboard",
	features: DEVPULSE_FEATURES,
	order: 20,
});
