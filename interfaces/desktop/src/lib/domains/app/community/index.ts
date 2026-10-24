/**
 * @file Community domain public API.
 * @module @devpulse/domains/app/community
 */

export {
	communityState,
	fetchCommunityStatus,
	fetchFeed,
	setCommunityEnabled,
	syncCommunityFeed,
} from "./data-access/index.js";

export { default as CommunityFeedList } from "./ui/community-feed-list/CommunityFeedList.svelte";
export type { CommunityStatus, FeedItem, FeedKind, SyncResult } from "./util/index.js";
