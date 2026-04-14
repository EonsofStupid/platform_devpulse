/**
 * @file Hardware State Rune
 * @module @devpulse/domains/app/models/data-access/hardware
 *
 * Purely reactive hardware metrics — Rust pushes data via Tauri events.
 * No setInterval, no browser throttling issues. Frontend just listens.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { FitIndicator, HardwareTier } from "../util/models.types.js";
import { calculateFit } from "../util/models.types.js";
import { fetchHardwareMetrics, type HardwareInfo } from "./hardware.service.js";

function normalizeMetricText(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function metricsSignature(metrics: HardwareInfo): string {
	return JSON.stringify({
		cpu: normalizeMetricText(metrics.cpu_name),
		gpu: normalizeMetricText(metrics.gpu_name),
		gpuError: normalizeMetricText(metrics.gpu_error),
		vram: metrics.gpu_vram_total_mb ?? 0,
		ram: metrics.ram_total_mb ?? 0,
		disk: metrics.disk_free_mb ?? 0,
	});
}

class HardwareState {
	metrics = $state<HardwareInfo | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	private unlisten: UnlistenFn | null = null;
	private refreshPromise: Promise<void> | null = null;
	private listenPromise: Promise<void> | null = null;
	private lastSignature: string | null = null;

	private applyMetrics(metrics: HardwareInfo, source: "refresh" | "push"): void {
		this.metrics = metrics;
		this.error = null;

		const signature = metricsSignature(metrics);
		if (signature !== this.lastSignature) {
			logInfo(
				"models.hardware",
				`${source} snapshot — cpu=${normalizeMetricText(metrics.cpu_name) ?? "none"} gpu=${normalizeMetricText(metrics.gpu_name) ?? "none"} gpuError=${normalizeMetricText(metrics.gpu_error) ?? "none"} vram=${metrics.gpu_vram_total_mb ?? 0}MB ram=${metrics.ram_total_mb}MB`,
			);
			this.lastSignature = signature;
		}
	}

	/** Fetch once on demand (initial load, manual refresh). */
	async refresh(reason = "manual"): Promise<void> {
		if (this.refreshPromise) return this.refreshPromise;

		this.loading = true;
		logInfo("models.hardware", `refresh() start — reason=${reason}`);

		this.refreshPromise = (async () => {
			try {
				const metrics = await fetchHardwareMetrics();
				this.applyMetrics(metrics, "refresh");
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				this.error = msg;
				logError("models.hardware", `refresh() failed — reason=${reason}: ${msg}`);
			} finally {
				this.loading = false;
				this.refreshPromise = null;
			}
		})();

		return this.refreshPromise;
	}

	/**
	 * Start listening to Rust-pushed hardware events.
	 * Replaces setInterval polling — Rust runs a 2s loop that is never
	 * throttled by browser visibility/focus state.
	 */
	async startListening(): Promise<void> {
		return this.ensureListening("legacy-startListening");
	}

	/**
	 * Idempotent app-wide listener bootstrap.
	 * Any caller can request telemetry without racing or resetting listeners.
	 */
	async ensureListening(reason = "manual"): Promise<void> {
		if (this.unlisten) {
			if (!this.metrics && !this.loading) {
				await this.refresh(`ensureListening:${reason}`);
			}
			return;
		}

		if (this.listenPromise) return this.listenPromise;

		this.listenPromise = (async () => {
			logInfo("models.hardware", `ensureListening() start — reason=${reason}`);
			await this.refresh(`listen:${reason}`);

			this.unlisten = await listen<HardwareInfo>("model:hardware", (event) => {
				this.applyMetrics(event.payload, "push");
			});

			logInfo("models.hardware", `ensureListening() attached — reason=${reason}`);
		})().finally(() => {
			this.listenPromise = null;
		});

		return this.listenPromise;
	}

	/** Stop listening to hardware events. */
	stopListening(): void {
		if (this.unlisten) {
			logInfo("models.hardware", "stopListening() — detached hardware listener");
			this.unlisten();
			this.unlisten = null;
		}
	}

	// ── Derived Values ──────────────────────────────────

	get hasSnapshot(): boolean {
		return this.metrics !== null;
	}

	get status(): "idle" | "loading" | "ready" | "error" {
		if (this.loading) return "loading";
		if (this.error) return "error";
		if (this.metrics) return "ready";
		return "idle";
	}

	get hasGpu(): boolean {
		return this.gpuName !== null;
	}

	get gpuError(): string | null {
		return normalizeMetricText(this.metrics?.gpu_error);
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

	get gpuUtilPercent(): number {
		return this.metrics?.gpu_utilization_percent ?? 0;
	}

	get gpuTempC(): number | null {
		return this.metrics?.gpu_temperature_c ?? null;
	}

	get gpuName(): string | null {
		return normalizeMetricText(this.metrics?.gpu_name);
	}

	get gpuSummary(): string {
		if (!this.hasSnapshot) return "Scanning your hardware...";
		if (this.gpuName) return this.gpuName;
		return "No dedicated GPU detected";
	}

	get cpuName(): string | null {
		return normalizeMetricText(this.metrics?.cpu_name);
	}

	get cpuCores(): number {
		return this.metrics?.cpu_cores ?? 0;
	}

	get ramTotalMb(): number {
		return this.metrics?.ram_total_mb ?? 0;
	}

	get ramAvailableMb(): number {
		return this.metrics?.ram_available_mb ?? 0;
	}

	get diskFreeMb(): number | null {
		return this.metrics?.disk_free_mb ?? null;
	}

	get tier(): HardwareTier {
		const vram = this.vramTotalMb;
		if (!this.hasGpu) return "CpuOnly";
		if (vram >= 24000) return "High";
		if (vram >= 16000) return "JessePrimary";
		if (vram >= 12000) return "Mid";
		if (vram >= 8000) return "Floor";
		return "Minimal";
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
