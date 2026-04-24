/**
 * @file Hardware State Rune
 * @module @devpulse/domains/app/models/data-access/hardware
 *
 * Reactive hardware metrics pushed from Rust every ~2s. Consumers opt in
 * via `hardwareState.subscribe(reason)` — the underlying Tauri listener
 * is ref-counted through `createTauriEvent("model:hardware")`, so the
 * first subscriber attaches and the last unsubscriber detaches. Safe
 * across HMR, multiple routes, and concurrent consumers.
 *
 * Honors the 2026-04-20 no-auto-load directive: nothing attaches at
 * module import or root-layout mount. A listener only exists while at
 * least one component/page is explicitly subscribed.
 */

import { logError, logInfo } from "$lib/sys/logger.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { createTauriEvent } from "$lib/sys/streams/tauri-event.svelte.js";
import type { FitIndicator, HardwareTier } from "../util/models.types.js";
import { calculateFit } from "../util/models.types.js";
import { fetchHardwareMetrics, type HardwareInfo } from "./hardware.service.js";

const hardwareStream = createTauriEvent<HardwareInfo>("model:hardware");

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
	// Intentionally NOT $state. This is internal ref-count bookkeeping
	// for the "refresh-on-first-subscribe" branch in subscribe(). Making
	// it reactive while subscribe() both reads (`=== 0` check) and writes
	// (`+= 1`) inside the same `$effect` produces effect_update_depth_
	// exceeded — the effect tracker sees a read, a write of the same
	// signal, schedules a re-run, the cleanup decrements (another write),
	// re-run reads + writes again → infinite loop. Nothing outside this
	// class observes the count reactively, so a plain field is correct.
	private subscriberCount = 0;
	private refreshPromise: Promise<void> | null = null;
	private lastSignature: string | null = null;

	constructor() {
		// When the platform transitions to ready AFTER someone has already
		// subscribed, fire the refresh that was deferred in subscribe().
		// `$effect.root()` creates a reactive scope outside a component —
		// safe for a module-level singleton whose lifetime is the app.
		// Tracked deps: platformState.isReady (via `phase` $state), this.metrics,
		// this.loading. subscriberCount is intentionally non-reactive (see
		// field comment), so its read acts as a plain guard, not a trigger.
		$effect.root(() => {
			$effect(() => {
				if (platformState.isReady && this.subscriberCount > 0 && !this.metrics && !this.loading) {
					logInfo("models.hardware", "platform ready — firing deferred refresh");
					void this.refresh("platform-ready");
				}
			});
		});
	}

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
	 * Subscribe to Rust-pushed hardware telemetry. Ref-counted: the
	 * underlying `model:hardware` listener attaches on the first
	 * subscriber and detaches when the last one drops.
	 *
	 * Returns the teardown function. Typical usage:
	 *
	 * ```svelte
	 * $effect(() => hardwareState.subscribe("devpulse-dashboard"));
	 * ```
	 *
	 * If no snapshot has arrived yet, kicks off a one-shot refresh so
	 * the first paint has data. All concurrent refresh calls share the
	 * same promise.
	 */
	subscribe(reason = "manual"): () => void {
		const firstSubscriber = this.subscriberCount === 0;
		const unsubscribeStream = hardwareStream.handle((payload) => {
			this.applyMetrics(payload, "push");
		});
		this.subscriberCount += 1;

		if (firstSubscriber) {
			logInfo("models.hardware", `subscribe() attached — reason=${reason}`);
			if (!this.metrics && !this.loading) {
				// Gate the initial refresh on platform readiness. The hardware
				// IPC command rejects with "Platform not ready" during boot, so
				// firing refresh() eagerly just produces noise. The stream at
				// `hardwareStream` above is already attached, so live Rust
				// pushes will deliver snapshots as soon as emission starts; and
				// the $effect.root in the constructor will fire a deferred
				// refresh the moment platformState flips to ready.
				if (platformState.isReady) {
					void this.refresh(`subscribe:${reason}`);
				} else {
					logInfo(
						"models.hardware",
						`subscribe() deferring first refresh — platform not ready (will retry on platform:ready)`,
					);
				}
			}
		}

		return () => {
			unsubscribeStream();
			this.subscriberCount -= 1;
			if (this.subscriberCount === 0) {
				logInfo("models.hardware", `subscribe() last subscriber dropped — reason=${reason}`);
			}
		};
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
		if (vram >= 10000) return "Mid";
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
