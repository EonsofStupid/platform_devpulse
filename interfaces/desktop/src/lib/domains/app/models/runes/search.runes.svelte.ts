/**
 * @file Search State Rune
 * @module @devpulse/domains/app/models/runes/search
 *
 * Reactive state for HuggingFace model search.
 */

import { type HfSearchResult, searchHuggingFace } from "../services/search.service.js";

class SearchState {
	query = $state("");
	results = $state<HfSearchResult[]>([]);
	searching = $state(false);
	error = $state<string | null>(null);

	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	/** Execute search with current query. */
	async search(): Promise<void> {
		if (!this.query.trim()) {
			this.results = [];
			return;
		}

		this.searching = true;
		this.error = null;

		try {
			this.results = await searchHuggingFace(this.query.trim(), 20);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			console.error(`[SearchState] HARD FAIL: ${this.error}`);
		} finally {
			this.searching = false;
		}
	}

	/** Set query and debounce search (300ms). */
	setQuery(q: string): void {
		this.query = q;

		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		if (!q.trim()) {
			this.results = [];
			this.error = null;
			return;
		}

		this.debounceTimer = setTimeout(() => {
			this.search();
		}, 300);
	}

	/** Clear search state. */
	clear(): void {
		this.query = "";
		this.results = [];
		this.error = null;
		this.searching = false;
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}
}

export const searchState = new SearchState();
