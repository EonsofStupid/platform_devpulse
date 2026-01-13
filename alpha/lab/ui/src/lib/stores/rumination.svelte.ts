// Rumination Store - Svelte 5 runes for thought tree and layers

import * as api from '$lib/api/rumination';

class RuminationStore {
	state = $state<api.RuminationState | null>(null);
	tree = $state<api.ThoughtTree | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	// Polling interval
	private pollInterval: ReturnType<typeof setInterval> | null = null;

	get isActive() {
		return this.state?.active ?? false;
	}

	get currentLayer() {
		return this.state?.current_layer ?? null;
	}

	get layers() {
		return this.state?.layers ?? [];
	}

	get totalNodes() {
		return this.tree?.total_nodes ?? 0;
	}

	get selectedPath() {
		return this.tree?.selected_path ?? [];
	}

	async loadState() {
		this.loading = true;
		this.error = null;
		try {
			this.state = await api.getState();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load rumination state';
		} finally {
			this.loading = false;
		}
	}

	async loadTree() {
		try {
			this.tree = await api.getTree();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load thought tree';
		}
	}

	async loadAll() {
		await Promise.all([this.loadState(), this.loadTree()]);
	}

	startPolling(intervalMs = 1000) {
		if (this.pollInterval) return;
		this.loadAll();
		this.pollInterval = setInterval(() => this.loadAll(), intervalMs);
	}

	stopPolling() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
}

export const ruminationStore = new RuminationStore();
