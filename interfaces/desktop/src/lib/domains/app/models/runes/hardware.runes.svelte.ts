/**
 * @file Hardware State Rune
 * @module @devpulse/domains/app/models/runes/hardware
 *
 * Purely reactive hardware metrics — Rust pushes data via Tauri events.
 * No setInterval, no browser throttling issues. Frontend just listens.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { fetchHardwareMetrics, type HardwareInfo } from "../services/hardware.service.js";
import type { FitIndicator, HardwareTier } from "../types/models.types.js";
import { calculateFit } from "../types/models.types.js";

class HardwareState {
	metrics = $state<HardwareInfo | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	private unlisten: UnlistenFn | null = null;

	/** Fetch once on demand (initial load, manual refresh). */
	async refresh(): Promise<void> {
		this.loading = true;
		try {
			this.metrics = await fetchHardwareMetrics();
			this.error = null;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg;
			console.error(`[HardwareState] HARD FAIL: ${msg}`);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Start listening to Rust-pushed hardware events.
	 * Replaces setInterval polling — Rust runs a 2s loop that is never
	 * throttled by browser visibility/focus state.
	 */
	async startListening(): Promise<void> {
		this.stopListening();
		// Initial fetch so we have data immediately
		await this.refresh();

		this.unlisten = await listen<HardwareInfo>("model:hardware", (event) => {
			this.metrics = event.payload;
			this.error = null;
		});
	}

	/** Stop listening to hardware events. */
	stopListening(): void {
		if (this.unlisten) {
			this.unlisten();
			this.unlisten = null;
		}
	}

	// ── Derived Values ──────────────────────────────────

	get hasGpu(): boolean {
		return this.metrics?.gpu_name !== null && this.metrics?.gpu_name !== undefined;
	}

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

	get vramColor(): string {
		const pct = this.vramPercent;
		if (pct < 60) return "var(--signal-success)";
		if (pct < 85) return "var(--signal-warning)";
		return "var(--signal-error)";
	}

	get tier(): HardwareTier {
		const vram = this.vramTotalMb;
		if (!this.hasGpu) return "cpu_only";
		if (vram >= 16000) return "high";
		if (vram >= 8000) return "medium";
		if (vram >= 4000) return "low";
		return "minimal";
	}

	fitForModel(vramEstimateMb: number): FitIndicator {
		return calculateFit(
			vramEstimateMb,
			this.metrics?.gpu_vram_free_mb ?? null,
			this.metrics?.gpu_vram_total_mb ?? null,
		);
	}
}

export const hardwareState = new HardwareState();
