/**
 * @file sys/contracts/domains/app/wiredfront/wiredfront.contract.ts
 * @description WiredFront domain contracts
 */

import { flags } from "../../../../cfg/flags.js";
import { defineDomain } from "../../../routing/domain.contract.js";

/** WiredFront feature identifiers */
export const WIREDFRONT_FEATURES = ["dashboard", "gallery", "connectorhub", "viziwizi"] as const;

export type WiredFrontFeature = (typeof WIREDFRONT_FEATURES)[number];

/** WiredFront domain metadata constant */
export const WIREDFRONT_DOMAIN = defineDomain({
	id: "wiredfront",
	owner: "app/wiredfront",
	status: flags.ENABLE_WIREDFRONT ? "coming-soon" : "hidden",
	defaultFeature: "dashboard",
	features: WIREDFRONT_FEATURES,
	order: 50,
});
