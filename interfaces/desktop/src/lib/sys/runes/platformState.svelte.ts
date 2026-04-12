/**
 * @file sys/runes/platformState.svelte.ts
 * @module @devpulse/sys/runes/platformState
 * @description Unified platform state — merges boot progress + health into one reactive class.
 *
 * ## Boot Strategy: Snapshot-First
 * 1. Wait for Tauri IPC bridge to be ready (poll window.__TAURI_INTERNALS__).
 * 2. On init(), call `get_boot_state` to get accumulated events from Rust.
 * 3. Apply snapshot (replay all events that fired before we mounted).
 * 4. Register live event listeners for any events that fire after.
 * 5. Events are idempotent — Map keyed by step name, so duplicates are safe.
 *
 * ## Lifecycle Safety
 * - init() is guarded against double-calls and destroyed-during-init races.
 * - destroy() is idempotent — safe to call multiple times.
 * - All intervals and listeners are tracked and cleaned up.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { BootSnapshot } from "$lib/sys/generated/boot.types.js";
import type { SystemHealth } from "$lib/sys/generated/health.types.js";
import type { InitEvent, InitStatus } from "$lib/sys/generated/init.types.js";
import { resolveLabel } from "$lib/sys/generated/terminology.js";
import { logError, logInfo, markIpcReady } from "$lib/sys/logger.js";

export type BootPhase = "initializing" | "ready" | "failed";
export type SubsystemState = "pending" | "loading" | "ready" | "skipped" | "failed";

export interface SubsystemInfo {
	name: string;
	state: SubsystemState;
	latencyMs: number | null;
	message: string | null;
	friendlyName: string;
}

const HEALTH_POLL_INTERVAL_MS = 15_000;
const TAURI_READY_POLL_MS = 100;
const TAURI_READY_TIMEOUT_MS = 30_000;

/**
 * Wait for Tauri IPC bridge to be available.
 * The webview can mount before the Rust backend connects the IPC channel.
 * Without this, `listen()` and `invoke()` crash with "Cannot read properties of undefined".
 */
function waitForTauri(): Promise<void> {
	return new Promise((resolve, reject) => {
		// biome-ignore lint/suspicious/noExplicitAny: Tauri injects __TAURI_INTERNALS__ on window
		if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
			logInfo("ipc", "Tauri IPC bridge already available");
			resolve();
			return;
		}

		logInfo("ipc", "Waiting for Tauri IPC bridge...");
		const start = Date.now();
		let pollCount = 0;
		const check = setInterval(() => {
			pollCount++;
			// biome-ignore lint/suspicious/noExplicitAny: Tauri injects __TAURI_INTERNALS__ on window
			if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
				clearInterval(check);
				logInfo(
					"ipc",
					`Tauri IPC bridge connected after ${Date.now() - start}ms (${pollCount} polls)`,
				);
				resolve();
			} else if (Date.now() - start > TAURI_READY_TIMEOUT_MS) {
				clearInterval(check);
				logError(
					"ipc",
					`TIMEOUT — Tauri IPC not available after ${TAURI_READY_TIMEOUT_MS}ms (${pollCount} polls)`,
				);
				reject(new Error(`Tauri IPC not available after ${TAURI_READY_TIMEOUT_MS}ms`));
			}
		}, TAURI_READY_POLL_MS);
	});
}

function mapInitStatus(status: InitStatus): SubsystemState {
	switch (status) {
		case "Running":
			return "loading";
		case "Ok":
			return "ready";
		case "Error":
			return "failed";
		case "Skipped":
			return "skipped";
	}
}

class PlatformState {
	phase = $state<BootPhase>("initializing");
	subsystems = $state<Map<string, SubsystemInfo>>(new Map());
	health = $state<SystemHealth | null>(null);
	error = $state<string | null>(null);

	/** Elapsed seconds since boot started — ticks every second for live UI. */
	bootElapsedSecs = $state(0);
	/** Human-readable label for what the boot is currently doing. */
	bootStepLabel = $state("Connecting to engine...");

	// ── Model readiness (separate from platform boot) ──────────
	/** Whether AI models are downloaded, assigned, and ready. */
	modelsReady = $state(false);
	/** Whether this is the first run (no models configured). */
	modelsFirstRun = $state(true);
	/** Number of models in the registry. */
	modelCount = $state(0);
	/** Number of slots with assigned models. */
	assignedCount = $state(0);

	private healthInterval: ReturnType<typeof setInterval> | null = null;
	private bootTimer: ReturnType<typeof setInterval> | null = null;
	private unlisteners: Array<() => void> = [];
	private initialized = false;
	private destroyed = false;

	// Derived state — boot readiness
	get isReady(): boolean {
		return this.phase === "ready";
	}

	/** Platform AND models both ready — the full app can render. */
	get isFullyReady(): boolean {
		return this.phase === "ready" && this.modelsReady;
	}

	/** Any non-skipped subsystem reported `Error` — blocking until fixed. */
	get hasSubsystemFailure(): boolean {
		for (const s of this.subsystems.values()) {
			if (s.state === "failed") return true;
		}
		return false;
	}

	/** Platform booted but models need setup — show the wizard. */
	get needsModelSetup(): boolean {
		return this.phase === "ready" && !this.modelsReady;
	}

	get isBooting(): boolean {
		return this.phase === "initializing";
	}

	get hasFailed(): boolean {
		return this.phase === "failed";
	}

	/** Elapsed boot time formatted for display: "12s", "1m 23s" */
	get bootElapsedFormatted(): string {
		const s = this.bootElapsedSecs;
		if (s < 60) return `${s}s`;
		const m = Math.floor(s / 60);
		const rem = s % 60;
		return `${m}m ${rem}s`;
	}

	get progress(): number {
		let active = 0;
		let ready = 0;
		this.subsystems.forEach((info) => {
			if (info.state !== "skipped") {
				active++;
				if (info.state === "ready") ready++;
			}
		});
		const total = Math.max(4, active);
		return Math.round((ready / total) * 100);
	}

	get connectionStatus(): "online" | "offline" | "hybrid" {
		if (!this.isReady) return "offline";
		switch (this.health?.status) {
			case "Healthy":
				return "online";
			case "Degraded":
				return "hybrid";
			default:
				return "offline";
		}
	}

	get uptimeFormatted(): string {
		if (!this.health) return "--";
		const secs = this.health.uptime_secs;
		const days = Math.floor(secs / 86400);
		const hours = Math.floor((secs % 86400) / 3600);
		const minutes = Math.floor((secs % 3600) / 60);
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}

	subsystemStatus(name: string): SubsystemInfo | undefined {
		return this.subsystems.get(name);
	}

	subsystemList(): SubsystemInfo[] {
		const list: SubsystemInfo[] = [];
		this.subsystems.forEach((info) => {
			list.push(info);
		});
		return list;
	}

	/** Initialize — call once from root layout onMount. */
	async init(): Promise<void> {
		if (this.initialized) return;
		this.initialized = true;
		this.destroyed = false;

		logInfo("boot", "platformState.init() starting");

		// 0. Start elapsed timer — ticks every second so the UI shows it's alive
		this.bootElapsedSecs = 0;
		this.bootStepLabel = "Connecting to engine...";
		this.bootTimer = setInterval(() => {
			this.bootElapsedSecs++;
		}, 1000);

		// 1. Wait for Tauri IPC bridge — prevents transformCallback crash
		try {
			await waitForTauri();
			markIpcReady(); // Flush buffered logs to Rust
		} catch (e) {
			logError("boot", `Tauri IPC bridge unavailable: ${e}`);
			this.phase = "failed";
			this.error = "Tauri IPC bridge unavailable";
			this.bootStepLabel = "Tauri IPC bridge unavailable";
			this.stopBootTimer();
			return;
		}

		// Bail if destroy() was called while we were waiting
		if (this.destroyed) return;

		logInfo("boot", "IPC ready — loading boot state from Rust");
		this.bootStepLabel = "Loading boot state...";

		// 2. Catch up — get snapshot of boot state accumulated in Rust
		try {
			const snapshot = await invoke<BootSnapshot>("get_boot_state");
			if (this.destroyed) return;
			logInfo("boot", `Boot snapshot: phase=${snapshot.phase}, events=${snapshot.events.length}`);
			this.applySnapshot(snapshot);
		} catch (e) {
			logError("boot", `get_boot_state failed — boot snapshot unavailable: ${e}`);
		}

		if (this.destroyed) return;

		logInfo("boot", "Registering live event listeners");

		// 3. Register live event listeners (idempotent — Map keyed by step name)
		const unlistenSubsystem = await listen<InitEvent>("platform:subsystem-status", (e) => {
			this.applyEvent(e.payload);
		});
		this.unlisteners.push(unlistenSubsystem);

		if (this.destroyed) {
			unlistenSubsystem();
			return;
		}

		const unlistenPhase = await listen<{
			phase: string;
			health?: SystemHealth;
			error?: string;
		}>("platform:boot-phase", (e) => {
			this.applyPhaseTransition(e.payload);
		});
		this.unlisteners.push(unlistenPhase);

		// Listen for model readiness signal from boot_task
		const unlistenModels = await listen<{
			ready: boolean;
			firstRun: boolean;
			modelCount: number;
			slotCount: number;
			assignedCount: number;
			error?: string;
		}>("platform:models-status", (e) => {
			const p = e.payload;
			this.modelsReady = p.ready;
			this.modelsFirstRun = p.firstRun;
			this.modelCount = p.modelCount;
			this.assignedCount = p.assignedCount;
			if (typeof p.error === "string" && p.error.length > 0) {
				this.error = p.error;
				logError("boot", `Models status error: ${p.error}`);
			} else if (p.ready) {
				this.error = null;
			}
			logInfo(
				"boot",
				`Models status: ready=${p.ready} models=${p.modelCount} assigned=${p.assignedCount}`,
			);

			// First-run trigger is now route-hosted under src/routes/(setup).
			// BootOverlay handles the actual navigation into /model-loader so
			// there is a single rendering path for onboarding.
			if (p.firstRun) {
				logInfo("boot", "First-run detected — setup route required");
			}
		});
		this.unlisteners.push(unlistenModels);

		if (this.destroyed) {
			this.cleanupListeners();
		}
	}

	/** Apply a full boot snapshot (catch-up from Rust state). */
	private applySnapshot(snapshot: BootSnapshot): void {
		const phaseMap: Record<string, BootPhase> = {
			Initializing: "initializing",
			Ready: "ready",
			Failed: "failed",
		};
		this.phase = phaseMap[snapshot.phase] ?? "initializing";

		// Replay all accumulated events
		for (const event of snapshot.events) {
			this.applyEvent(event);
		}

		if (snapshot.health) this.health = snapshot.health;
		if (snapshot.error) this.error = snapshot.error;
		if (this.phase === "ready") this.startHealthPolling();
	}

	/** Apply a single subsystem init event (idempotent via Map key). */
	private applyEvent(event: InitEvent): void {
		const existing = this.subsystems.get(event.step);
		const friendlyName = existing?.friendlyName ?? resolveLabel(event.step);
		const state = mapInitStatus(event.status);
		const info: SubsystemInfo = {
			name: event.step,
			state,
			latencyMs: event.latency_us,
			message: event.message,
			friendlyName,
		};
		const next = new Map(this.subsystems);
		next.set(event.step, info);
		this.subsystems = next;

		// Update the human-readable step label
		if (state === "loading") {
			this.bootStepLabel = `Starting ${friendlyName}...`;
		} else if (state === "ready") {
			this.bootStepLabel = `${friendlyName} ready`;
		} else if (state === "failed") {
			this.bootStepLabel = `${friendlyName} failed`;
			logError("boot", `Subsystem failed: step=${event.step} message=${event.message ?? "none"}`);
		}
	}

	/** Apply a boot phase transition event. */
	private applyPhaseTransition(payload: {
		phase: string;
		health?: SystemHealth;
		error?: string;
	}): void {
		const phaseMap: Record<string, BootPhase> = {
			initializing: "initializing",
			ready: "ready",
			failed: "failed",
		};
		this.phase = phaseMap[payload.phase] ?? this.phase;
		if (payload.health) this.health = payload.health;
		if (payload.error) this.error = payload.error;

		if (payload.phase === "ready") {
			logInfo("boot", "Platform READY — all services healthy");
			this.bootStepLabel = "All systems go";
			this.stopBootTimer();
			this.startHealthPolling();
		} else if (payload.phase === "failed") {
			logError("boot", `Platform FAILED: ${payload.error ?? "unknown"}`);
			this.bootStepLabel = payload.error ?? "Boot failed";
			this.stopBootTimer();
		}
	}

	private stopBootTimer(): void {
		if (this.bootTimer !== null) {
			clearInterval(this.bootTimer);
			this.bootTimer = null;
		}
	}

	/** Start periodic health polling (after boot). */
	private startHealthPolling(): void {
		if (this.healthInterval !== null || this.destroyed) return;

		// Immediate first poll
		this.refreshHealth();

		this.healthInterval = setInterval(() => {
			this.refreshHealth();
		}, HEALTH_POLL_INTERVAL_MS);
	}

	private async refreshHealth(): Promise<void> {
		if (this.destroyed) return;
		try {
			const h = await invoke<SystemHealth>("get_status");
			if (this.destroyed) return;
			this.health = h;
			this.error = null;
		} catch (e) {
			if (this.destroyed) return;
			// Platform might still be booting — silently ignore
			if (this.isReady) {
				this.error = e instanceof Error ? e.message : String(e);
			}
		}
	}

	private cleanupListeners(): void {
		this.unlisteners.forEach((fn) => {
			fn();
		});
		this.unlisteners = [];
	}

	/** Cleanup — call from layout onDestroy. Idempotent. */
	destroy(): void {
		this.destroyed = true;
		this.initialized = false;
		this.cleanupListeners();
		this.stopBootTimer();
		if (this.healthInterval !== null) {
			clearInterval(this.healthInterval);
			this.healthInterval = null;
		}
	}
}

export const platformState = new PlatformState();
