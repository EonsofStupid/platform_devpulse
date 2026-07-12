/**
 * @file Knowledge context rune
 * @module @devpulse/domains/app/knowledge/data-access
 *
 * The shared current-workflow tracker that makes every knowledge
 * surface "dynamic and sporadic based on deep planning at the time
 * of context / function / action / workflow."
 *
 * # What this is
 *
 * A singleton Svelte 5 rune-backed class that holds a stack of
 * `KnowledgeContext` frames. Components push a frame on mount
 * ("we're inside the wizard's preset phase") and pop on destroy.
 * The TOP frame is what `KnowledgeDeck` reads when it asks the
 * engine for an entry — the engine's selector uses `tool` + tag
 * affinity to pick a contextually-relevant entry.
 *
 * # Why a stack (not just a single current frame)
 *
 * Surfaces nest. A wizard step opens; inside it a downloader
 * overlay appears; inside that, a long-running action fires.
 * Each pushes its own context. When the inner surface closes,
 * the outer context becomes top again automatically. No manual
 * "restore the previous context" wiring.
 *
 * # The "sporadic" part
 *
 * The picker (`pickNextEntry` on the deck) consults a recent-id
 * memory and skips entries shown within the last N minutes —
 * this is what makes the same surface not repeat the same DYK
 * on every revisit. Combined with the engine-side cooldown
 * (3600s default), the user sees variety without manual rotation.
 *
 * # The "deep planning" hook
 *
 * `enrichContext()` is the seam for cortex-driven selection.
 * Today it returns the context as-is. When the engine bridge
 * lands (`Platform::capture_chat_turn` etc.), this seam will
 * query the active session's recent turns and the user's
 * current task to bias selection toward entries that match
 * what the user is ACTUALLY doing — not just which page they
 * have open.
 */

import type { KnowledgeEntryType } from "../util/index.js";

/**
 * A single frame on the context stack. Pushed by a surface on
 * mount and popped on destroy.
 */
export interface KnowledgeContextFrame {
	/** Stable id for this frame — used when popping. */
	id: string;
	/**
	 * Tool tag matching the engine's `tool` field on entries
	 * (e.g. `"chat"`, `"wizard"`, `"models"`, `"devforge"`).
	 * Drives affinity weighting in the engine's selector.
	 */
	tool: string;
	/**
	 * Optional sub-context (e.g. `"chat:empty"` / `"wizard:preset"` /
	 * `"action:download:in-progress"`). The engine doesn't use this
	 * for selection today — it's stashed for cortex-driven
	 * enrichment to consume in the future.
	 */
	scope?: string;
	/**
	 * Preferred entry type for this frame. When set, the deck will
	 * fetch that type first; when unset, the deck chooses based on
	 * surface defaults.
	 */
	preferred?: KnowledgeEntryType;
}

/**
 * Cap on the recent-entry memory. Entries shown within the last
 * N pushes are suppressed by the deck's selection skip.
 */
const RECENT_MEMORY_CAP = 24;

class KnowledgeContextState {
	/** Frame stack — top of stack is the active context. */
	stack = $state<KnowledgeContextFrame[]>([]);
	/** Recent entry ids — used by the deck to enforce sporadic variety. */
	recentIds = $state<string[]>([]);

	/** The active context frame, or null when no frames are pushed. */
	get current(): KnowledgeContextFrame | null {
		return this.stack.length === 0 ? null : this.stack[this.stack.length - 1];
	}

	/**
	 * Push a frame. Returns a `pop` fn that removes this specific
	 * frame even if it's no longer on top (caller pops out of
	 * order). Use the returned fn in `onDestroy` to keep cleanup
	 * symmetric with the mount-time push.
	 */
	push(frame: KnowledgeContextFrame): () => void {
		this.stack = [...this.stack, frame];
		return () => this.popById(frame.id);
	}

	/** Pop by id — survives out-of-order cleanup. */
	popById(id: string): void {
		const idx = this.stack.findIndex((f) => f.id === id);
		if (idx === -1) return;
		const next = [...this.stack];
		next.splice(idx, 1);
		this.stack = next;
	}

	/** Pop the top frame regardless of id. */
	pop(): void {
		if (this.stack.length === 0) return;
		this.stack = this.stack.slice(0, -1);
	}

	/**
	 * Record that an entry id was just shown. The deck calls
	 * this after a successful fetch so the next pick can skip
	 * it. Maintains a bounded ring buffer (cap defined above).
	 */
	noteShown(id: string): void {
		const next = [id, ...this.recentIds.filter((existing) => existing !== id)];
		this.recentIds = next.length > RECENT_MEMORY_CAP ? next.slice(0, RECENT_MEMORY_CAP) : next;
	}

	/** Whether the given entry was shown recently. */
	wasShownRecently(id: string): boolean {
		return this.recentIds.includes(id);
	}

	/**
	 * Enrich the current context frame for the cortex-driven
	 * picker. Today a passthrough; future: queries cortex for
	 * session-aware bias (current chat topic, in-flight action,
	 * project being edited) and folds those into the returned
	 * frame.
	 */
	enrichContext(): KnowledgeContextFrame | null {
		// TODO(cortex-bridge): when Platform::capture_chat_turn
		// lands, this method becomes async and consults the
		// active session's recent turns + the in-flight action
		// tracker. For now we return the raw frame — the engine's
		// selector still gets tool + cooldown signals.
		return this.current;
	}
}

/** Singleton — every surface reads + writes through this instance. */
export const knowledgeContext = new KnowledgeContextState();
