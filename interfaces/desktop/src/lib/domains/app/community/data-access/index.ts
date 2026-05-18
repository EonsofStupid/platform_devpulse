/**
 * @file Community data-access barrel.
 * @module @devpulse/domains/app/community/data-access
 */

export {
	fetchCommunityStatus,
	fetchFeed,
	setCommunityEnabled,
	syncCommunityFeed,
} from "./community.service.js";
export { communityState } from "./community.state.svelte.js";
