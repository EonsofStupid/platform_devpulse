/**
 * @file Community rune — singleton state for the feed + status.
 * @module @devpulse/domains/app/community/data-access
 *
 * Single source of truth for `/devpulse/community` and the "From the
 * community" panel on `/latest`. Pages read `.items`, `.status`,
 * `.loading` and call `.refresh()` / `.forceSync()` — they never
 * `invoke()` directly.
 */

import { logInfo } from "#lib/sys/logger.js";
import type { CommunityStatus, FeedItem, FeedKind, SyncResult } from "../util/index.js";
import {
	fetchCommunityStatus,
	fetchFeed,
	setCommunityEnabled,
	syncCommunityFeed,
} from "./community.service.js";

class CommunityState {
	items = $state<FeedItem[]>([]);
	status = $state<CommunityStatus>({
		enabled: true,
		lastSyncAt: 0,
		cacheStale: true,
		cachedItems: 0,
	});
	lastSyncResult = $state<SyncResult | null>(null);
	loading = $state(false);

	/** Re-read cache + status without touching the network. */
	async refresh(kind?: FeedKind, limit?: number): Promise<void> {
		this.loading = true;
		try {
			const [items, status] = await Promise.all([fetchFeed(kind, limit), fetchCommunityStatus()]);
			this.items = items;
			this.status = status;
		} finally {
			this.loading = false;
		}
	}

	/** Pull from the remote, then re-read the cache. */
	async forceSync(): Promise<void> {
		this.loading = true;
		try {
			this.lastSyncResult = await syncCommunityFeed(true);
			logInfo("community.state", `forceSync → ${this.lastSyncResult.kind}`);
			const [items, status] = await Promise.all([fetchFeed(), fetchCommunityStatus()]);
			this.items = items;
			this.status = status;
		} finally {
			this.loading = false;
		}
	}

	async toggleEnabled(): Promise<void> {
		const next = !this.status.enabled;
		await setCommunityEnabled(next);
		this.status = { ...this.status, enabled: next };
	}
}

export const communityState = new CommunityState();
