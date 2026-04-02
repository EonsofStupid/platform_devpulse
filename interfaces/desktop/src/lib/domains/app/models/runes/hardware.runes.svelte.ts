/**
 * @file Hardware State Rune
 * @module @devpulse/domains/app/models/runes/hardware
 *
 * Reactive hardware metrics with automatic polling.
 * Uses specta-generated HardwareInfo type (snake_case fields).
 */

import { fetchHardwareMetrics, type HardwareInfo } from "../services/hardware.service.js";
import type { FitIndicator, HardwareTier } from "../types/models.types.js";
import { calculateFit } from "../types/models.types.js";

class HardwareState {
	metrics = $state<HardwareInfo | null>(null);
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
		return this.metrics?.gpu_name !== null && this.metrics?.gpu_name !== undefined;
	}

	/** Why GPU detection failed, if applicable. */
	get gpuError(): string | null {
		return this.metrics?.gpu_error ?? null;
	}

	get vramUsedMb(): number {
		return this.metrics?.gpu_vram_used_mb ?? 0;
	}

	get vramTotalMb(): number {
		return this.metrics?.gpu_vram_total_mb ?? 0;
	}

	get vramFreeMb(): number {
		return this.metrics?.gpu_vram_free_mb ?? 0;
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
			this.metrics?.gpu_vram_free_mb ?? null,
			this.metrics?.gpu_vram_total_mb ?? null,
		);
	}
}

export const hardwareState = new HardwareState();
