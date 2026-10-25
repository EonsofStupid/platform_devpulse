// Background Store - Svelte 5 runes for system status and diagnostics
//
// Uses the new /api/background/system endpoint for real model loading data.

import * as api from '$lib/api/background';

class BackgroundStore {
	// System status (new real data)
	systemStatus = $state<api.SystemStatus | null>(null);

	// Legacy data (for backward compatibility)
	status = $state<api.BackgroundStatus | null>(null);
	minions = $state<api.Minion[]>([]);

	// Models data
	modelsResponse = $state<api.ModelsResponse | null>(null);

	loading = $state(false);
	error = $state<string | null>(null);

	// Polling interval
	private pollInterval: ReturnType<typeof setInterval> | null = null;

	// ==========================================================================
	// NEW: System Status Getters
	// ==========================================================================

	get health(): string {
		return this.systemStatus?.health ?? 'unknown';
	}

	get uptimeSecs(): number {
		return this.systemStatus?.uptime_secs ?? 0;
	}

	get uptime(): string {
		const seconds = this.uptimeSecs;
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		if (hours > 0) return `${hours}h ${minutes % 60}m`;
		if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
		return `${seconds}s`;
	}

	get totalVramMb(): number {
		return this.systemStatus?.total_vram_mb ?? 0;
	}

	get totalRamMb(): number {
		return this.systemStatus?.total_ram_mb ?? 0;
	}

	get totalMemoryMb(): number {
		return this.totalVramMb + this.totalRamMb;
	}

	get components(): api.ComponentInfo[] {
		return this.systemStatus?.components ?? [];
	}

	// ==========================================================================
	// Model Getters
	// ==========================================================================

	get models(): api.ModelInfo[] {
		if (!this.modelsResponse) return [];
		return api.modelsToArray(this.modelsResponse);
	}

	get loadedModels(): api.ModelInfo[] {
		return this.models.filter((m) => m.loaded);
	}

	get llmLoaded(): boolean {
		return this.modelsResponse?.llm?.loaded ?? false;
	}

	get embedderLoaded(): boolean {
		return this.modelsResponse?.embedder?.loaded ?? false;
	}

	get rerankerLoaded(): boolean {
		return this.modelsResponse?.reranker?.loaded ?? false;
	}

	get voiceLoaded(): boolean {
		return this.modelsResponse?.voice_tts?.loaded ?? false;
	}

	// ==========================================================================
	// Minion Getters
	// ==========================================================================

	get activeMinions(): number {
		return this.minions.filter((m) => m.active).length;
	}

	// ==========================================================================
	// Data Loading
	// ==========================================================================

	async loadAll() {
		this.loading = true;
		this.error = null;
		try {
			const [systemStatus, status, minions, modelsResponse] = await Promise.all([
				api.getSystemStatus(),
				api.getStatus(),
				api.getMinions(),
				api.getModels()
			]);
			this.systemStatus = systemStatus;
			this.status = status;
			this.minions = minions;
			this.modelsResponse = modelsResponse;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load background data';
			console.error('Background store error:', e);
		} finally {
			this.loading = false;
		}
	}

	startPolling(intervalMs = 2000) {
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

	// ==========================================================================
	// Helpers
	// ==========================================================================

	getComponentByName(name: string): api.ComponentInfo | undefined {
		return this.components.find((c) => c.id === name);
	}

	isComponentLoaded(name: string): boolean {
		const component = this.getComponentByName(name);
		return component?.status === 'loaded';
	}

	isComponentLoading(name: string): boolean {
		const component = this.getComponentByName(name);
		return component?.status === 'loading';
	}

	hasComponentError(name: string): boolean {
		const component = this.getComponentByName(name);
		return component?.status === 'failed';
	}

	getComponentError(name: string): string | null {
		const component = this.getComponentByName(name);
		return component?.error ?? null;
	}
}

export const backgroundStore = new BackgroundStore();
