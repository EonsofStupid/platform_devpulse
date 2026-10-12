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
import type { HardwareMetrics } from "$lib/sys/generated/bindings.js";
import { logDebug } from "$lib/sys/logger.js";

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

	private refCount = 0;
	private off: (() => void) | null = null;

	/**
	 * Subscribe to live hardware metrics. Returns a teardown fn that
	 * MUST be called when the component unmounts (return it from
	 * `$effect` / `onMount`).
	 */
	subscribe(reason: string): () => void {
		this.refCount += 1;
		if (this.refCount === 1) {
			this.off = signalFabric.on("hardware", (metrics) => {
				this.apply(metrics);
			});
			logDebug("hardwareState", `attached (reason: ${reason})`);
		}
		return () => {
			this.refCount -= 1;
			if (this.refCount === 0) {
				this.off?.();
				this.off = null;
				logDebug("hardwareState", "detached (refs: 0)");
			}
		};
	}

	private apply(m: HardwareMetrics): void {
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
