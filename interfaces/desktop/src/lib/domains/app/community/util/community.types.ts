/**
 * @file Community domain types — mirror of the Rust `FeedItem` surface.
 * @module @devpulse/domains/app/community/util
 *
 * Field names mirror the kebab-case Rust shape after serde's
 * `rename_all = "camelCase"` transform, so `created_at` becomes
 * `createdAt` etc.
 */

export type FeedKind = "announcement" | "knowledge_contribution" | "activity";

export interface FeedItem {
	id: string;
	kind: FeedKind;
	title: string | null;
	body: string | null;
	actor: string | null;
	createdAt: number;
	syncedAt: number;
	url: string | null;
	payloadJson: string;
}

export type SyncResult =
	| { kind: "synced"; upserted: number; completed_at: number }
	| { kind: "skipped"; reason: string }
	| { kind: "failed"; error: string };

export interface CommunityStatus {
	enabled: boolean;
	lastSyncAt: number;
	cacheStale: boolean;
	cachedItems: number;
}
