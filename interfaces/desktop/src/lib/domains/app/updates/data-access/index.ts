/**
 * @file Updates domain data-access barrel.
 * @module @devpulse/domains/app/updates/data-access
 */

export {
	checkForUpdate,
	getUpdateChannel,
	installUpdate,
	setUpdateChannel,
} from "./updates.service.js";
export { updatesState } from "./updates.state.svelte.js";
