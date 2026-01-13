/**
 * Hardware metrics store - real CPU/RAM/GPU data from Tauri
 * Polls get_hardware_metrics every second for live updates
 */
import { invoke } from '@tauri-apps/api/core';

export interface GpuMetrics {
	name: string;
	vram_total_gb: number;
	vram_used_gb: number;
	vram_usage_pct: number;
	utilization_pct: number | null;
	temperature_c: number | null;
}

export interface HardwareMetrics {
	cpu_usage_pct: number;
	ram_total_gb: number;
	ram_used_gb: number;
	ram_usage_pct: number;
	gpu: GpuMetrics | null;
}

class HardwareStore {
	// Reactive state
	metrics = $state<HardwareMetrics | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	// Polling interval
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private pollMs = 1000; // 1 second

	/**
	 * Start polling hardware metrics
	 */
	start() {
		if (this.intervalId) return; // Already running

		// Initial fetch
		this.fetch();

		// Poll every second
		this.intervalId = setInterval(() => {
			this.fetch();
		}, this.pollMs);
	}

	/**
	 * Stop polling
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Fetch metrics once
	 */
	async fetch() {
		try {
			this.loading = true;
			this.error = null;

			const data = await invoke<HardwareMetrics>('get_hardware_metrics');
			this.metrics = data;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			console.error('Failed to fetch hardware metrics:', e);
		} finally {
			this.loading = false;
		}
	}

	// Derived values for convenience
	get cpuPct(): number {
		return this.metrics?.cpu_usage_pct ?? 0;
	}

	get ramUsedGb(): number {
		return this.metrics?.ram_used_gb ?? 0;
	}

	get ramTotalGb(): number {
		return this.metrics?.ram_total_gb ?? 0;
	}

	get ramPct(): number {
		return this.metrics?.ram_usage_pct ?? 0;
	}

	get vramUsedGb(): number {
		return this.metrics?.gpu?.vram_used_gb ?? 0;
	}

	get vramTotalGb(): number {
		return this.metrics?.gpu?.vram_total_gb ?? 0;
	}

	get vramPct(): number {
		return this.metrics?.gpu?.vram_usage_pct ?? 0;
	}

	get gpuName(): string {
		return this.metrics?.gpu?.name ?? 'No GPU';
	}

	get hasGpu(): boolean {
		return this.metrics?.gpu !== null;
	}
}

export const hardwareStore = new HardwareStore();
