/**
 * @file hardwareState — GPU + VRAM telemetry rune (ref-counted).
 * @module @devpulse/domains/app/models/data-access/hardware-state
 *
 * Singleton rune that exposes live GPU stats (name, util %, temp, VRAM).
 * Values arrive as `hardware` state signals from the signal fabric. Rust
 * samples hardware only while some window is watching (the fabric registers
 * interest on the first subscriber), at the interval set in
 * `[signals.sample_interval_ms]`; the fabric replays the current value to a
 * store that subscribes late.
 *
 * **Ref-counted**: the fabric handler is registered only while at least
 * one mounted component called `subscribe(reason)`, per the 2026-04-20
 * no-auto-load directive.
 *
 * Typical use inside a component:
 *
 * ```svelte
 * import { hardwareState } from "$lib/domains/app/models/index.js";
 * $effect(() => hardwareState.subscribe("VramBar"));
 * ```
 *
 * The `$effect` cleanup auto-detaches when the component unmounts.
 */

import { signalFabric } from "$lib/sys/events/signal-fabric.js";
import { commands, type HardwareInfo, type HardwareMetrics } from "$lib/sys/generated/bindings.js";
import { logDebug, logError, logInfo } from "$lib/sys/logger.js";
import { calculateFit, type FitIndicator, type HardwareTier } from "../util/models.types.js";
import { fetchHardwareMetrics } from "./hardware.service.js";

class HardwareState {
	/** System-wide CPU load, 0–100. */
	cpuUsagePercent = $state<number | null>(null);
	/** System RAM in use, MB. */
	ramUsedMb = $state<number | null>(null);
	/** System RAM installed, MB. */
	ramTotalMb = $state<number | null>(null);
	gpuName = $state<string | null>(null);
	gpuUtilPercent = $state<number | null>(null);
	gpuTempC = $state<number | null>(null);
	vramUsedMb = $state<number | null>(null);
	vramTotalMb = $state<number | null>(null);
	hasGpu = $state<boolean>(false);
	gpuError = $state<string | null>(null);
	/**
	 * The full snapshot — disk free, CPU name and cores, VRAM free — read by
	 * `refresh` (restored from the May model cards, `2035d613^`).
	 */
	metrics = $state<HardwareInfo | null>(null);
	/** The tier the kernel detected for this machine (its presets config). */
	tier = $state<HardwareTier | null>(null);
	/** A `refresh` is running. */
	loading = $state(false);
	/** Why the last `refresh` failed. */
	error = $state<string | null>(null);

	private refCount = 0;
	private off: (() => void) | null = null;
	private offBoot: (() => void) | null = null;
	private refreshing: Promise<void> | null = null;
	private sampleRevision = 0;
	private ready = false;

	/**
	 * Subscribe to live hardware metrics. Returns a teardown fn that
	 * MUST be called when the component unmounts (return it from
	 * `$effect` / `onMount`).
	 */
	subscribe(reason: string): () => void {
		this.refCount += 1;
		if (this.refCount === 1) {
			this.off = signalFabric.on("hardware", (snapshot) => {
				this.sampleRevision += 1;
				if (snapshot.status === "available") {
					this.apply(snapshot.metrics);
					this.error = null;
					if (this.ready && !this.metrics) void this.refresh("measurements recovered");
				} else {
					this.unavailable(snapshot.error);
				}
			});
			logDebug("hardwareState", `attached (reason: ${reason})`);
			// The full snapshot needs the platform: read it once boot is ready
			// (the fabric replays boot's current phase to a late subscriber).
			this.offBoot = signalFabric.on("boot", (status) => {
				this.ready = status.phase === "ready";
				if (this.ready && !this.metrics) void this.refresh(`subscribe:${reason}`);
			});
		}
		return () => {
			this.refCount -= 1;
			if (this.refCount === 0) {
				this.off?.();
				this.off = null;
				this.offBoot?.();
				this.offBoot = null;
				this.ready = false;
				logDebug("hardwareState", "detached (refs: 0)");
			}
		};
	}

	/**
	 * Read the full snapshot and the kernel's tier for this machine. Calls
	 * made while one is running share it.
	 */
	async refresh(reason = "manual"): Promise<void> {
		if (this.refreshing) return this.refreshing;
		this.loading = true;
		const revision = this.sampleRevision;
		this.refreshing = (async () => {
			try {
				const metrics = await fetchHardwareMetrics();
				if (revision !== this.sampleRevision) return;
				this.metrics = metrics;
				this.apply(metrics);
				const config = await commands.autoConfigure();
				if (revision !== this.sampleRevision) return;
				if (config.status === "error") throw new Error(config.error);
				if (config.status === "ok") {
					const parsed: { tier?: HardwareTier } = JSON.parse(config.data);
					this.tier = parsed.tier ?? null;
				}
				this.error = null;
				logInfo("hardwareState", `refreshed (reason: ${reason}) — tier=${this.tier ?? "unknown"}`);
			} catch (e) {
				if (revision !== this.sampleRevision) return;
				this.unavailable(e instanceof Error ? e.message : String(e));
				logError("hardwareState", `refresh failed (reason: ${reason}): ${this.error}`);
			} finally {
				this.loading = false;
				this.refreshing = null;
			}
		})();
		return this.refreshing;
	}

	/** A full snapshot has been read. */
	get hasSnapshot(): boolean {
		return this.metrics !== null;
	}

	/** VRAM free, MB (from the snapshot, else total minus used). */
	get vramFreeMb(): number {
		return (
			this.metrics?.gpu_vram_free_mb ??
			Math.max(0, (this.vramTotalMb ?? 0) - (this.vramUsedMb ?? 0))
		);
	}

	/** The CPU's name, when the snapshot has one. */
	get cpuName(): string | null {
		return this.metrics?.cpu_name?.trim() || null;
	}

	/** Disk free where the models live, MB. */
	get diskFreeMb(): number | null {
		return this.metrics?.disk_free_mb ?? null;
	}

	/** How well a model of this VRAM size fits this machine. */
	fitForModel(vramEstimateMb: number): FitIndicator {
		return calculateFit(
			vramEstimateMb,
			this.metrics?.gpu_vram_free_mb ?? null,
			this.metrics?.gpu_vram_total_mb ?? this.vramTotalMb,
		);
	}

	private unavailable(error: string): void {
		this.error = error;
		this.metrics = null;
		this.tier = null;
		this.cpuUsagePercent = null;
		this.ramUsedMb = null;
		this.ramTotalMb = null;
		this.gpuName = null;
		this.gpuUtilPercent = null;
		this.gpuTempC = null;
		this.vramUsedMb = null;
		this.vramTotalMb = null;
		this.hasGpu = false;
		this.gpuError = null;
	}

	private apply(m: HardwareMetrics): void {
		if (this.metrics) this.metrics = { ...this.metrics, ...m };
		this.cpuUsagePercent = m.cpu_usage_percent;
		this.ramUsedMb = m.ram_used_mb;
		this.ramTotalMb = m.ram_total_mb;
		this.gpuName = m.gpu_name;
		this.gpuUtilPercent = m.gpu_utilization_percent;
		this.gpuTempC = m.gpu_temperature_c;
		this.vramUsedMb = m.gpu_vram_used_mb;
		this.vramTotalMb = m.gpu_vram_total_mb;
		this.hasGpu = m.gpu_name !== null;
		this.gpuError = m.gpu_error;
	}
}

export const hardwareState = new HardwareState();
