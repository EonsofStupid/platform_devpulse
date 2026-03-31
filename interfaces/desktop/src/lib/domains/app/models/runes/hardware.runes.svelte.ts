/**
 * @file Hardware State Rune
 * @module @devpulse/domains/app/models/runes/hardware
 *
 * Reactive hardware metrics with automatic polling.
 */

import { fetchHardwareMetrics } from "../services/hardware.service.js";
import type { FitIndicator, HardwareMetrics, HardwareTier } from "../types/models.types.js";
import { calculateFit } from "../types/models.types.js";

class HardwareState {
	metrics = $state<HardwareMetrics | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	private intervalId: ReturnType<typeof setInterval> | null = null;

	/** Fetch fresh hardware metrics. Stores error in state — does NOT swallow. */
	async refresh(): Promise<void> {
		this.loading = true;
		try {
			this.metrics = await fetchHardwareMetrics();
			this.error = null; // clear previous error on success
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			// In dev mode: stop polling on first failure so the error is visible
			this.stopPolling();
			console.error(`[HardwareState] HARD FAIL: ${msg}`);
		} finally {
			this.loading = false;
		}
	}

	/** Start polling at the given interval. Stops on first error. */
	startPolling(intervalMs = 2000): void {
		this.stopPolling();
		this.refresh();
		this.intervalId = setInterval(() => {
			// Don't poll if we have an error — force user to see it
			if (this.error) {
				this.stopPolling();
				return;
			}
			this.refresh();
		}, intervalMs);
	}

	/** Stop polling. */
	stopPolling(): void {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	// ── Derived Values ──────────────────────────────────

	get hasGpu(): boolean {
		return this.metrics?.gpuName !== null && this.metrics?.gpuName !== undefined;
	}

	get vramUsedMb(): number {
		return this.metrics?.gpuVramUsedMb ?? 0;
	}

	get vramTotalMb(): number {
		return this.metrics?.gpuVramTotalMb ?? 0;
	}

	get vramFreeMb(): number {
		return this.metrics?.gpuVramFreeMb ?? 0;
	}

	get vramPercent(): number {
		if (!this.vramTotalMb) return 0;
		return (this.vramUsedMb / this.vramTotalMb) * 100;
	}

	/** Color for the VRAM gauge: green < 60%, yellow 60-85%, red > 85%. */
	get vramColor(): string {
		const pct = this.vramPercent;
		if (pct < 60) return "oklch(0.75 0.18 155)"; // green
		if (pct < 85) return "oklch(0.82 0.16 85)"; // yellow
		return "oklch(0.65 0.22 25)"; // red
	}

	/** Detect hardware tier. */
	get tier(): HardwareTier {
		const vram = this.vramTotalMb;
		if (!this.hasGpu) return "cpu_only";
		if (vram >= 16000) return "high";
		if (vram >= 8000) return "medium";
		if (vram >= 4000) return "low";
		return "minimal";
	}

	/** Calculate fit for a model given current hardware state. */
	fitForModel(vramEstimateMb: number): FitIndicator {
		return calculateFit(
			vramEstimateMb,
			this.metrics?.gpuVramFreeMb ?? null,
			this.metrics?.gpuVramTotalMb ?? null,
		);
	}
}

export const hardwareState = new HardwareState();
