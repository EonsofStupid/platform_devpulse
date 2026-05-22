/**
 * @file Knowledge library IPC service.
 * @module @devpulse/domains/app/knowledge/data-access
 *
 * Wraps Tauri commands for knowledge entry selection and reactions.
 * Uses invoke() directly until specta bindings regenerate.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";
import type {
	KnowledgeEntry,
	KnowledgeEntryRaw,
	KnowledgeEntryType,
	KnowledgeReaction,
} from "../util/index.js";
import { parseKnowledgeEntry } from "../util/index.js";

/**
 * Get a knowledge entry matching the given type and optional tool context.
 *
 * Backend uses affinity-weighted random selection with cooldown.
 * Returns null if no eligible entries exist.
 */
export async function getKnowledgeEntry(
	entryType: KnowledgeEntryType,
	tool?: string,
): Promise<KnowledgeEntry | null> {
	try {
		const raw = await invoke<KnowledgeEntryRaw | null>("get_knowledge_entry", {
			entryType: entryType,
			tool: tool ?? null,
		});
		if (!raw) return null;
		const entry = parseKnowledgeEntry(raw);
		logInfo("knowledge", `Entry selected: ${entry.id} (${entry.entryType})`);
		return entry;
	} catch (e) {
		logError("knowledge", `Failed to get knowledge entry: ${e}`);
		return null;
	}
}

/**
 * Record a user reaction (helpful / not_helpful) to a knowledge entry.
 */
export async function recordReaction(entryId: string, reaction: KnowledgeReaction): Promise<void> {
	try {
		await invoke("record_knowledge_reaction", { entryId, reaction });
		logInfo("knowledge", `Reaction recorded: ${entryId} → ${reaction}`);
	} catch (e) {
		logError("knowledge", `Failed to record reaction: ${e}`);
	}
}

/**
 * Result of a remote-catalog sync run. Mirrors the Rust
 * `KnowledgeSyncResult` enum (serde tag = "kind").
 */
export type KnowledgeSyncResult =
	| { kind: "synced"; upserted: number; version: string }
	| { kind: "skipped"; reason: string }
	| { kind: "failed"; error: string };

/**
 * Pull the latest knowledge catalog from the configured Supabase
 * Storage bucket. Returns the outcome; never throws — network /
 * config failures degrade to the `skipped` or `failed` variants.
 */
export async function syncKnowledgeFromRemote(): Promise<KnowledgeSyncResult> {
	try {
		const result = await invoke<KnowledgeSyncResult>("sync_knowledge_from_remote");
		logInfo("knowledge", `sync_knowledge_from_remote → ${result.kind}`);
		return result;
	} catch (e) {
		logError("knowledge", `sync_knowledge_from_remote failed: ${e}`);
		return { kind: "failed", error: e instanceof Error ? e.message : String(e) };
	}
}
