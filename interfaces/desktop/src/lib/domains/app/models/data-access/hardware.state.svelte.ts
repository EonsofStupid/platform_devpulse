/**
 * @file hardwareState — GPU + VRAM telemetry rune (ref-counted).
 * @module @devpulse/domains/app/models/data-access/hardware-state
 *
 * Singleton rune that exposes live GPU stats (name, util %, temp, VRAM).
 * Live values arrive as `hardware` signals from the engine's signal
 * fabric (pushed every 2 s by Rust); the first subscriber also loads one
 * snapshot so cards render before the next tick.
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

import { getHardwareMetrics } from "$lib/sys/bindings/models/index.js";
import { signalFabric } from "$lib/sys/events/signal-fabric.js";
import type { HardwareMetrics } from "$lib/sys/generated/bindings.js";
import { logDebug } from "$lib/sys/logger.js";

class HardwareState {
	gpuName = $state<string | null>(null);
	gpuUtilPercent = $state<number | null>(null);
	gpuTempC = $state<number | null>(null);
	vramUsedMb = $state<number | null>(null);
	vramTotalMb = $state<number | null>(null);
	hasGpu = $state<boolean>(false);
	gpuError = $state<string | null>(null);

	private refCount = 0;
	private off: (() => void) | null = null;
	private receivedLive = false;

	/**
	 * Subscribe to live hardware metrics. Returns a teardown fn that
	 * MUST be called when the component unmounts (return it from
	 * `$effect` / `onMount`).
	 */
	subscribe(reason: string): () => void {
		this.refCount += 1;
		if (this.refCount === 1) {
			this.attach(reason);
		}
		return () => {
			this.refCount -= 1;
			if (this.refCount === 0) {
				this.detach();
			}
		};
	}

	private attach(reason: string): void {
		// Live handler first so no tick is missed while the snapshot loads.
		this.off = signalFabric.on("hardware", (metrics) => {
			this.receivedLive = true;
			this.apply(metrics);
		});
		void this.loadSnapshot();
		logDebug("hardwareState", `attached (reason: ${reason}, refs: ${this.refCount})`);
	}

	private async loadSnapshot(): Promise<void> {
		const r = await getHardwareMetrics();
		if (r.status !== "ok") {
			this.gpuError = String(r.error);
			return;
		}
		// A live tick that landed first is newer than this snapshot.
		if (!this.receivedLive) {
			this.apply(r.data);
		}
	}

	private detach(): void {
		this.off?.();
		this.off = null;
		this.receivedLive = false;
		logDebug("hardwareState", "detached (refs: 0)");
	}

	private apply(m: HardwareMetrics): void {
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
