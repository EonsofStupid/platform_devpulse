/**
 * @file Updates domain public API.
 * @module @devpulse/domains/app/updates
 */

export {
	LATEST_DOMAIN,
	LATEST_FEATURES,
	type LatestFeature,
} from "#lib/sys/contracts/index.js";
export {
	checkForUpdate,
	getUpdateChannel,
	installUpdate,
	setUpdateChannel,
	updatesState,
} from "./data-access/index.js";

export { default as LatestUpdateCard } from "./feature/latest-update-card/LatestUpdateCard.svelte";
export type {
	UpdateChannel,
	UpdateDownloadProgressPayload,
	UpdateInfo,
	UpdateLifecyclePhase,
} from "./util/index.js";
