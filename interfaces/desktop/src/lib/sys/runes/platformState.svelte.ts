/**
 * @file sys/runes/platformState.svelte.ts
 * @module @devpulse/sys/runes/platformState
 * @description Unified platform state — merges boot progress + health into one reactive class.
 *
 * ## Boot Strategy: Snapshot-First
 * 1. On init(), call `get_boot_state` to get accumulated events from Rust.
 * 2. Apply snapshot (replay all events that fired before we mounted).
 * 3. Register live event listeners for any events that fire after.
 * 4. Events are idempotent — Map keyed by step name, so duplicates are safe.
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

	private healthInterval: ReturnType<typeof setInterval> | null = null;
	private unlisteners: Array<() => void> = [];

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
		// 1. Catch up — get snapshot of boot state accumulated in Rust
		try {
			const snapshot = await invoke<BootSnapshot>("get_boot_state");
			this.applySnapshot(snapshot);
		} catch (e) {
			console.warn("get_boot_state unavailable, relying on events:", e);
		}

		// 2. Register live event listeners (idempotent — Map keyed by step name)
		const unlistenSubsystem = await listen<InitEvent>(
			"platform:subsystem-status",
			(e) => {
				this.applyEvent(e.payload);
			},
		);
		this.unlisteners.push(unlistenSubsystem);

		const unlistenPhase = await listen<{
			phase: string;
			health?: SystemHealth;
			error?: string;
		}>("platform:boot-phase", (e) => {
			this.applyPhaseTransition(e.payload);
		});
		this.unlisteners.push(unlistenPhase);
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
		const info: SubsystemInfo = {
			name: event.step,
			state: mapInitStatus(event.status),
			latencyMs: event.latency_ms,
			message: event.message,
			friendlyName: existing?.friendlyName ?? resolveLabel(event.step),
		};
		const next = new Map(this.subsystems);
		next.set(event.step, info);
		this.subsystems = next;
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
		if (payload.phase === "ready") this.startHealthPolling();
	}

	/** Start periodic health polling (after boot). */
	private startHealthPolling(): void {
		if (this.healthInterval !== null) return;

		// Immediate first poll
		this.refreshHealth();

		this.healthInterval = setInterval(() => {
			this.refreshHealth();
		}, HEALTH_POLL_INTERVAL_MS);
	}

	private async refreshHealth(): Promise<void> {
		try {
			const h = await invoke<SystemHealth>("get_status");
			this.health = h;
			this.error = null;
		} catch (e) {
			// Platform might still be booting — silently ignore
			if (this.isReady) {
				this.error = e instanceof Error ? e.message : String(e);
			}
		}
	}

	/** Cleanup — call from layout onDestroy. */
	destroy(): void {
		this.unlisteners.forEach((fn) => fn());
		this.unlisteners = [];
		if (this.healthInterval !== null) {
			clearInterval(this.healthInterval);
			this.healthInterval = null;
		}
	}
}

export const platformState = new PlatformState();
