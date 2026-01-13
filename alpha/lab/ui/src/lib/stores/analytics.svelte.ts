// Analytics Store - Svelte 5 runes for DuckDB metrics

import { getSummary, type FullAnalytics, type InferenceStats, type HopStats } from '$lib/api/analytics';

class AnalyticsStore {
	data = $state<FullAnalytics | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	lastUpdated = $state<number | null>(null);

	get inference(): InferenceStats | null {
		return this.data?.inference ?? null;
	}

	get hops(): HopStats | null {
		return this.data?.hops ?? null;
	}

	get eventCount(): number {
		return this.data?.event_count ?? 0;
	}

	async refresh(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			this.data = await getSummary();
			this.lastUpdated = Date.now();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	clear(): void {
		this.data = null;
		this.error = null;
		this.lastUpdated = null;
	}
}

export const analyticsStore = new AnalyticsStore();
