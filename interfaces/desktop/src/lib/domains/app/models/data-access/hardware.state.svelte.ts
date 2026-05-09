/**
 * @file hardwareState — GPU + VRAM telemetry rune (ref-counted).
 * @module @devpulse/domains/app/models/data-access/hardware-state
 *
 * Singleton rune that exposes live GPU stats (name, util %, temp, VRAM).
 * **Ref-counted listener**: the underlying Tauri event subscription
 * attaches only when at least one component calls `subscribe(reason)`,
 * and detaches when the last subscriber drops. This honors the
 * 2026-04-20 no-auto-load directive: zero hardware polling unless a
 * mounted UI surface explicitly asked for it.
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

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getHardwareMetrics } from "$lib/sys/bindings/models/index.js";
import { logDebug } from "$lib/sys/logger.js";

interface HardwarePayload {
	gpu_name: string | null;
	gpu_util_percent: number | null;
	gpu_temp_c: number | null;
	vram_used_mb: number | null;
	vram_total_mb: number | null;
	has_gpu: boolean;
	error: string | null;
}

class HardwareState {
	gpuName = $state<string | null>(null);
	gpuUtilPercent = $state<number | null>(null);
	gpuTempC = $state<number | null>(null);
	vramUsedMb = $state<number | null>(null);
	vramTotalMb = $state<number | null>(null);
	hasGpu = $state<boolean>(false);
	gpuError = $state<string | null>(null);

	private refCount = 0;
	private unlisten: UnlistenFn | null = null;
	private attaching: Promise<void> | null = null;

	/**
	 * Subscribe to live hardware metrics. Returns a teardown fn that
	 * MUST be called when the component unmounts (return it from
	 * `$effect` / `onMount`). The first subscriber attaches the Tauri
	 * listener and triggers an initial `getHardwareMetrics` fetch.
	 */
	subscribe(reason: string): () => void {
		this.refCount += 1;
		if (this.refCount === 1) {
			this.attaching = this.attach(reason);
		}
		return () => {
			this.refCount -= 1;
			if (this.refCount === 0) {
				void this.detach();
			}
		};
	}

	private async attach(reason: string): Promise<void> {
		// One-shot fetch so cards render usable values before the
		// next event tick.
		const r = await getHardwareMetrics();
		if (r.status === "ok") {
			this.applyPayload(r.data as unknown as HardwarePayload);
		} else {
			this.gpuError = String(r.error);
		}

		this.unlisten = await listen<HardwarePayload>("model:hardware", (event) => {
			this.applyPayload(event.payload);
		});

		logDebug("hardwareState", `attached (reason: ${reason}, refs: ${this.refCount})`);
	}

	private async detach(): Promise<void> {
		if (this.attaching) await this.attaching;
		if (this.unlisten) {
			this.unlisten();
			this.unlisten = null;
		}
		this.attaching = null;
		logDebug("hardwareState", "detached (refs: 0)");
	}

	private applyPayload(p: HardwarePayload): void {
		this.gpuName = p.gpu_name;
		this.gpuUtilPercent = p.gpu_util_percent;
		this.gpuTempC = p.gpu_temp_c;
		this.vramUsedMb = p.vram_used_mb;
		this.vramTotalMb = p.vram_total_mb;
		this.hasGpu = p.has_gpu;
		this.gpuError = p.error;
	}
}

export const hardwareState = new HardwareState();
