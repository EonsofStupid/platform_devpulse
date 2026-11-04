/**
 * @file Community feed IPC service.
 * @module @devpulse/domains/app/community/data-access
 *
 * Thin Tauri-command wrappers. Each call logs via the standard logger
 * so a failed `fetch_feed` surfaces in the session log alongside the
 * other domain events.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "#lib/sys/logger.js";
import type { CommunityStatus, FeedItem, FeedKind, SyncResult } from "../util/index.js";

/** Read recent feed items from the local cache. */
export async function fetchFeed(kind?: FeedKind, limit?: number): Promise<FeedItem[]> {
	try {
		const items = await invoke<FeedItem[]>("fetch_feed", {
			kind: kind ?? null,
			limit: limit ?? null,
		});
		logInfo("community", `fetch_feed → ${items.length} item(s)`);
		return items;
	} catch (e) {
		logError("community", `fetch_feed failed: ${e}`);
		return [];
	}
}

/** Trigger a refresh from the remote endpoint. */
export async function syncCommunityFeed(force = false): Promise<SyncResult> {
	try {
		const result = await invoke<SyncResult>("sync_community_feed", { force });
		logInfo("community", `sync_community_feed → ${result.kind}`);
		return result;
	} catch (e) {
		logError("community", `sync_community_feed failed: ${e}`);
		return { kind: "failed", error: e instanceof Error ? e.message : String(e) };
	}
}

/** Read the current community-subsystem health snapshot. */
export async function fetchCommunityStatus(): Promise<CommunityStatus> {
	try {
		return await invoke<CommunityStatus>("community_status");
	} catch (e) {
		logError("community", `community_status failed: ${e}`);
		return { enabled: true, lastSyncAt: 0, cacheStale: true, cachedItems: 0 };
	}
}

/** Flip the community-enabled toggle. */
export async function setCommunityEnabled(enabled: boolean): Promise<void> {
	try {
		await invoke<void>("set_community_enabled_cmd", { enabled });
		logInfo("community", `set_community_enabled_cmd → ${enabled}`);
	} catch (e) {
		logError("community", `set_community_enabled_cmd failed: ${e}`);
		throw e;
	}
}
