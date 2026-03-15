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
import type { InitEvent, InitStatus } from "$lib/sys/generated/init.types.js";
import type { SystemHealth } from "$lib/sys/generated/health.types.js";
import type { BootSnapshot } from "$lib/sys/generated/boot.types.js";
import { resolveLabel } from "$lib/sys/generated/terminology.js";

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
		// Already available
		if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
			console.log("[DevPulse:IPC] __TAURI_INTERNALS__ already available");
			resolve();
			return;
		}

		console.log("[DevPulse:IPC] Waiting for __TAURI_INTERNALS__...");
		const start = Date.now();
		let pollCount = 0;
		const check = setInterval(() => {
			pollCount++;
			if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
				clearInterval(check);
				console.log(`[DevPulse:IPC] __TAURI_INTERNALS__ found after ${Date.now() - start}ms (${pollCount} polls)`);
				resolve();
			} else if (Date.now() - start > TAURI_READY_TIMEOUT_MS) {
				clearInterval(check);
				console.error(`[DevPulse:IPC] TIMEOUT — __TAURI_INTERNALS__ not found after ${TAURI_READY_TIMEOUT_MS}ms (${pollCount} polls)`);
				console.error("[DevPulse:IPC] window keys:", Object.keys(window).filter(k => k.includes("TAURI") || k.includes("__")));
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

	private healthInterval: ReturnType<typeof setInterval> | null = null;
	private bootTimer: ReturnType<typeof setInterval> | null = null;
	private unlisteners: Array<() => void> = [];
	private initialized = false;
	private destroyed = false;

	// Derived state
	get isReady(): boolean {
		return this.phase === "ready";
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
		this.subsystems.forEach((info) => list.push(info));
		return list;
	}

	/** Initialize — call once from root layout onMount. */
	async init(): Promise<void> {
		if (this.initialized) return;
		this.initialized = true;
		this.destroyed = false;

		// 0. Start elapsed timer — ticks every second so the UI shows it's alive
		this.bootElapsedSecs = 0;
		this.bootStepLabel = "Connecting to engine...";
		this.bootTimer = setInterval(() => {
			this.bootElapsedSecs++;
		}, 1000);

		// 1. Wait for Tauri IPC bridge — prevents transformCallback crash
		try {
			await waitForTauri();
		} catch (e) {
			console.error("platformState: Tauri IPC never became available:", e);
			this.phase = "failed";
			this.error = "Tauri IPC bridge unavailable";
			this.bootStepLabel = "Tauri IPC bridge unavailable";
			this.stopBootTimer();
			return;
		}

		// Bail if destroy() was called while we were waiting
		if (this.destroyed) return;

		this.bootStepLabel = "Loading boot state...";

		// 2. Catch up — get snapshot of boot state accumulated in Rust
		try {
			const snapshot = await invoke<BootSnapshot>("get_boot_state");
			if (this.destroyed) return;
			this.applySnapshot(snapshot);
		} catch (e) {
			console.warn("get_boot_state unavailable, relying on events:", e);
		}

		if (this.destroyed) return;

		// 2. Register live event listeners (idempotent — Map keyed by step name)
		const unlistenSubsystem = await listen<InitEvent>(
			"platform:subsystem-status",
			(e) => {
				this.applyEvent(e.payload);
			},
		);
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
			latencyMs: event.latency_ms,
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
			this.bootStepLabel = "All systems go";
			this.stopBootTimer();
			this.startHealthPolling();
		} else if (payload.phase === "failed") {
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
		this.unlisteners.forEach((fn) => fn());
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
