/**
 * @file sys/contracts/domains/app/model-loader/model-loader.contract.ts
 * @description Model Loader domain contracts
 *
 * A hub that came after the owner's six, in their shape: every sidebar hub
 * has a contract, and the architecture test holds it to that.
 */

import { defineDomain } from "../../../routing/domain.contract.js";

/** Model Loader feature identifiers */
export const MODEL_LOADER_FEATURES = ["components", "downloader", "setup-wizard"] as const;

export type ModelLoaderFeature = (typeof MODEL_LOADER_FEATURES)[number];

/** Model Loader domain metadata constant */
export const MODEL_LOADER_DOMAIN = defineDomain({
	id: "model-loader",
	owner: "app/models",
	status: "active",
	features: MODEL_LOADER_FEATURES,
	order: 65,
});
