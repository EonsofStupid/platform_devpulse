/**
 * @file sys/contracts/domains/app/ui-demo/ui-demo.contract.ts
 * @description UI Demo domain contracts
 */

import { defineDomain } from "../../../routing/domain.contract.js";

/** UI Demo feature identifiers */
export const UIDEMO_FEATURES = ["dashboard"] as const;

export type UiDemoFeature = (typeof UIDEMO_FEATURES)[number];

/** UI Demo domain metadata constant */
export const UIDEMO_DOMAIN = defineDomain({
	id: "ui-demo",
	owner: "app/ui-demo",
	status: "active",
	defaultFeature: "dashboard",
	features: UIDEMO_FEATURES,
	order: 30,
});
