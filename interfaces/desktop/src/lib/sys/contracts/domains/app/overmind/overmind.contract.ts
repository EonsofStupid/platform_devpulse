/**
 * @file sys/contracts/domains/app/overmind/overmind.contract.ts
 * @description OverMind domain contracts
 */

import { flags } from "../../../../cfg/flags.js";
import { defineDomain } from "../../../routing/domain.contract.js";

/** OverMind feature identifiers */
export const OVERMIND_FEATURES = ["dashboard"] as const;

export type OvermindFeature = (typeof OVERMIND_FEATURES)[number];

/** OverMind domain metadata constant */
export const OVERMIND_DOMAIN = defineDomain({
	id: "overmind",
	owner: "app/overmind",
	status: flags.ENABLE_OVERMIND ? "active" : "hidden",
	defaultFeature: "dashboard",
	features: OVERMIND_FEATURES,
	order: 40,
});
