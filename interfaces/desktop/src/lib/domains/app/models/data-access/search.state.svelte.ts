/**
 * @file Search State Rune
 * @module @devpulse/domains/app/models/data-access/search
 *
 * Reactive state for HuggingFace model search.
 */

import { type HfSearchResultInfo, searchHuggingFace } from "./search.service.js";

/** Page size for HuggingFace search results. */
const PAGE_SIZE = 10;

class SearchState {
	query = $state("");
	results = $state<HfSearchResultInfo[]>([]);
	searching = $state(false);
	loadingMore = $state(false);
	error = $state<string | null>(null);
	/** Whether more results may be available from the API. */
	hasMore = $state(false);

	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private currentLimit = PAGE_SIZE;

	private cancelDebounce(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	private resetForEmptyQuery(): void {
		this.results = [];
		this.error = null;
		this.hasMore = false;
	}

	/** Execute search with current query (first page). */
	async search(): Promise<void> {
		if (!this.query.trim()) {
			this.results = [];
			this.hasMore = false;
			return;
		}

		this.searching = true;
		this.error = null;
		this.currentLimit = PAGE_SIZE;

		try {
			this.results = await searchHuggingFace(this.query.trim(), PAGE_SIZE);
			this.hasMore = this.results.length >= PAGE_SIZE;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			console.error(`[SearchState] HARD FAIL: ${this.error}`);
		} finally {
			this.searching = false;
		}
	}

	/** Load more results (next page). */
	async loadMore(): Promise<void> {
		if (!this.query.trim() || this.loadingMore || this.searching) return;

		this.loadingMore = true;
		this.error = null;
		this.currentLimit += PAGE_SIZE;

		try {
			const allResults = await searchHuggingFace(this.query.trim(), this.currentLimit);
			this.hasMore = allResults.length >= this.currentLimit;
			this.results = allResults;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loadingMore = false;
		}
	}

	/** Set query and debounce search (300ms). */
	setQuery(q: string): void {
		this.query = q;

		this.cancelDebounce();

		if (!q.trim()) {
			this.resetForEmptyQuery();
			return;
		}

		this.debounceTimer = setTimeout(() => {
			void this.search();
		}, 300);
	}

	/** Set the query and run search immediately. */
	async submitQuery(q: string): Promise<void> {
		this.query = q.trim();
		this.cancelDebounce();

		if (!this.query) {
			this.resetForEmptyQuery();
			return;
		}

		await this.search();
	}

	/** Clear search state. */
	clear(): void {
		this.query = "";
		this.results = [];
		this.error = null;
		this.searching = false;
		this.loadingMore = false;
		this.hasMore = false;
		this.currentLimit = PAGE_SIZE;
		this.cancelDebounce();
	}
}

export const searchState = new SearchState();
