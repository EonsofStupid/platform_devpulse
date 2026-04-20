/**
 * @file Knowledge state rune — reactive container for knowledge entries.
 * @module @devpulse/domains/app/knowledge/data-access
 *
 * Manages the currently displayed knowledge entry and reactions.
 * Components call fetchNext() to get a new entry from the backend.
 */

import { logInfo } from "$lib/sys/logger.js";
import type { KnowledgeEntry, KnowledgeEntryType, KnowledgeReaction } from "../util/index.js";
import { getKnowledgeEntry, recordReaction } from "./knowledge.service.js";

class KnowledgeState {
	/** The currently displayed entry (null = nothing to show). */
	current = $state<KnowledgeEntry | null>(null);

	/** Loading state. */
	loading = $state(false);

	/** Error message if last fetch failed. */
	error = $state<string | null>(null);

	/**
	 * Fetch the next knowledge entry of the given type.
	 *
	 * @param entryType - dyk, kdrop, frust, insight, or gloss
	 * @param tool - optional tool context for affinity weighting
	 */
	async fetchNext(entryType: KnowledgeEntryType, tool?: string): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			this.current = await getKnowledgeEntry(entryType, tool);
			if (this.current) {
				logInfo("knowledge.state", `Showing: ${this.current.id}`);
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Record a reaction and dismiss the current entry.
	 */
	async react(reaction: KnowledgeReaction): Promise<void> {
		if (!this.current) return;
		await recordReaction(this.current.id, reaction);
		logInfo("knowledge.state", `Reacted: ${this.current.id} → ${reaction}`);
		this.current = null;
	}

	/** Dismiss without reacting. */
	dismiss(): void {
		this.current = null;
	}
}

export const knowledgeState = new KnowledgeState();
