/**
 * Status Store - Svelte 5 runes state management for system status
 */
import {
	getStatus,
	getSystemStatus,
	getAdapters,
	setAdapter,
	type StatusInfo,
	type AdapterInfo,
	type SystemStatusSnapshot,
	type ComponentStatus,
	type LoadState
} from '$lib/api';

class StatusStore {
	status = $state<StatusInfo | null>(null);
	systemStatus = $state<SystemStatusSnapshot | null>(null);
	adapters = $state<AdapterInfo[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	pollInterval = $state<number | null>(null);

	/**
	 * Derived: Is AI ready?
	 */
	get aiReady(): boolean {
		return this.status?.ai_ready ?? false;
	}

	/**
	 * Derived: Active adapter name
	 */
	get activeAdapter(): string {
		return this.status?.active_adapter ?? 'None';
	}

	/**
	 * Derived: RRO component status
	 */
	get rroStatus(): ComponentStatus | null {
		return this.systemStatus?.rro ?? null;
	}

	/**
	 * Derived: Embedder component status
	 */
	get embedderStatus(): ComponentStatus | null {
		return this.systemStatus?.embedder ?? null;
	}

	/**
	 * Derived: Llm (VL) component status
	 */
	get llmStatus(): ComponentStatus | null {
		return this.systemStatus?.llm ?? null;
	}

	/**
	 * Derived: Is RRO loaded?
	 */
	get isRROLoaded(): boolean {
		return this.rroStatus?.state === 'Loaded';
	}

	/**
	 * Derived: Is Embedder loaded?
	 */
	get isEmbedderLoaded(): boolean {
		return this.embedderStatus?.state === 'Loaded';
	}

	/**
	 * Derived: Uptime in seconds
	 */
	get uptime(): number {
		return this.systemStatus?.uptime_secs ?? 0;
	}

	/**
	 * Fetch current status from backend
	 */
	async refresh(): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const [statusResult, systemResult, adaptersResult] = await Promise.all([
				getStatus(),
				getSystemStatus(),
				getAdapters()
			]);
			this.status = statusResult;
			this.systemStatus = systemResult;
			this.adapters = adaptersResult;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Set active adapter
	 */
	async switchAdapter(kind: string): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			await setAdapter(kind);
			await this.refresh();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Start polling for status updates
	 */
	startPolling(intervalMs: number = 5000): void {
		this.stopPolling();
		this.refresh();
		this.pollInterval = window.setInterval(() => this.refresh(), intervalMs);
	}

	/**
	 * Stop polling
	 */
	stopPolling(): void {
		if (this.pollInterval !== null) {
			window.clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
}

export const statusStore = new StatusStore();
