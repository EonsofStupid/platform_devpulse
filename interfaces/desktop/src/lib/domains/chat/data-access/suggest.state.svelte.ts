/**
 * @file Type-time suggestion rune singleton — debounced query against
 *       the `chat_prompt` corpus + accept/record verbs.
 * @module @devpulse/domains/chat/data-access/suggest.state.svelte
 */

import { withAction } from "$lib/sys/action-bus.svelte.js";
import { commands, type Suggestion } from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";

/**
 * Debounce window between the last keystroke and the embedder call.
 * 200 ms balances felt-instant feedback against not burning the
 * embedder on every key during fast typing.
 */
const DEBOUNCE_MS = 200;

/** Top-K suggestions to fetch per query. */
const RECALL_K = 5;

/** Minimum partial length before the surface starts querying. */
const MIN_PARTIAL_LEN = 3;

/** Default persona id for single-user installs. Empty string passes
 *  through as the engine-side default fallback. */
const DEFAULT_PERSONA = "";

function unwrap<T>(r: { status: "ok"; data: T } | { status: "error"; error: unknown }): T {
	if (r.status === "error") {
		const msg = typeof r.error === "string" ? r.error : String(r.error);
		throw new Error(msg);
	}
	return r.data;
}

class SuggestState {
	/** Current dropdown contents (empty = hidden). */
	suggestions = $state<Suggestion[]>([]);
	/** Index in `suggestions` the user has highlighted via arrow keys. */
	highlight = $state(0);
	/** True while a query is in flight — used by the dropdown spinner. */
	loading = $state(false);
	/** Most recent error surfaced to the dropdown footer. Null = clean. */
	error = $state<string | null>(null);
	/** Whether the user picked any suggestion to build the current draft.
	 *  Drives the `accepted=true` flag passed to `record_prompt` on send. */
	usedSuggestion = $state(false);

	#debounceTimer: ReturnType<typeof setTimeout> | null = null;
	#lastIssuedPartial = "";

	/** Cancel any pending query and hide the dropdown. */
	clear(): void {
		if (this.#debounceTimer !== null) {
			clearTimeout(this.#debounceTimer);
			this.#debounceTimer = null;
		}
		this.suggestions = [];
		this.highlight = 0;
		this.loading = false;
		this.error = null;
	}

	/** Reset the per-draft "did the user accept a suggestion" flag. */
	resetAcceptanceTracking(): void {
		this.usedSuggestion = false;
	}

	/** Schedule a debounced query against the `chat.suggest` slot. */
	queryDebounced(partial: string): void {
		if (this.#debounceTimer !== null) {
			clearTimeout(this.#debounceTimer);
		}
		const trimmed = partial.trim();
		if (trimmed.length < MIN_PARTIAL_LEN) {
			this.suggestions = [];
			this.highlight = 0;
			this.loading = false;
			this.error = null;
			return;
		}
		this.#debounceTimer = setTimeout(() => {
			void this.#runQuery(trimmed);
		}, DEBOUNCE_MS);
	}

	async #runQuery(partial: string): Promise<void> {
		this.#lastIssuedPartial = partial;
		this.loading = true;
		this.error = null;
		try {
			const result = unwrap(await commands.suggestQuery(partial, DEFAULT_PERSONA, RECALL_K));
			// Stale-response guard: if the user has typed further while
			// we were in flight, drop this result rather than overwrite
			// fresh state with a stale recall.
			if (this.#lastIssuedPartial !== partial) {
				return;
			}
			this.suggestions = result;
			this.highlight = 0;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			this.suggestions = [];
			logError("chat.suggest", `query failed: ${msg}`);
		} finally {
			if (this.#lastIssuedPartial === partial) {
				this.loading = false;
			}
		}
	}

	/** Move highlight one step (wraps around). */
	move(direction: 1 | -1): void {
		if (this.suggestions.length === 0) return;
		const next = (this.highlight + direction + this.suggestions.length) % this.suggestions.length;
		this.highlight = next;
	}

	/** Return the currently-highlighted suggestion or null if none. */
	currentSuggestion(): Suggestion | null {
		return this.suggestions[this.highlight] ?? null;
	}

	/** Mark that the user accepted a suggestion to build the current draft. */
	markAccepted(): void {
		this.usedSuggestion = true;
	}

	/** Persist a committed prompt into the corpus for future recall.
	 *
	 * Best-effort: recording feeds type-time recall, which needs the embedder
	 * slot. When the connected endpoint doesn't advertise one (standalone Tier-1,
	 * or a Clyffy whose capability omits the embedder), `suggestRecord` errors —
	 * that must NOT crash the send path. We swallow + log here so a caller can
	 * safely `void record(...)`; the prompt still sent, only future recall is
	 * skipped. Mirrors the graceful-degrade already in `#runQuery`. */
	async record(text: string): Promise<void> {
		const trimmed = text.trim();
		if (trimmed.length === 0) return;
		const accepted = this.usedSuggestion;
		try {
			await withAction("chat.suggest.record", "Recording prompt for recall…", async () => {
				unwrap(await commands.suggestRecord(trimmed, DEFAULT_PERSONA, accepted));
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			logError("chat.suggest", `record failed (non-fatal, recall skipped): ${msg}`);
		} finally {
			this.usedSuggestion = false;
		}
	}
}

export const suggestState = new SuggestState();
