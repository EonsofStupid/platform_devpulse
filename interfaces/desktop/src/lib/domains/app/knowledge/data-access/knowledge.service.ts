/**
 * @file Knowledge library IPC service.
 * @module @devpulse/domains/app/knowledge/data-access
 *
 * Wraps Tauri commands for knowledge entry selection and reactions.
 * Uses invoke() directly until specta bindings regenerate.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { KnowledgeEntry, KnowledgeEntryType, KnowledgeReaction } from "../util/index.js";
import { parseKnowledgeEntry } from "../util/index.js";

/**
 * Raw shape from Rust — payload is a JSON string, not parsed.
 */
interface KnowledgeEntryRaw {
	id: string;
	entryType: KnowledgeEntryType;
	tool: string | null;
	category: string;
	tier: string;
	payloadJson: string;
	tags: string[];
	added: string;
}

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
