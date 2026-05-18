/**
 * @file Updates domain public API.
 * @module @devpulse/domains/app/updates
 */

export {
	checkForUpdate,
	getUpdateChannel,
	installUpdate,
	setUpdateChannel,
	updatesState,
} from "./data-access/index.js";

export type {
	UpdateChannel,
	UpdateDownloadProgressPayload,
	UpdateInfo,
	UpdateLifecyclePhase,
} from "./util/index.js";
