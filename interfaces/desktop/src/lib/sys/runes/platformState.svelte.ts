/**
 * @file sys/runes/platformState.svelte.ts
 * @module @devpulse/sys/runes/platformState
 * @description Unified platform state — merges boot progress + health into one reactive class.
 * Tracks progressive hydration: subsystems boot in background, StatusBar shows real-time progress.
 * After boot complete, transitions to health polling.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { InitEvent, InitStatus } from "$lib/sys/generated/init.types.js";
import type {
	SystemHealth,
	HealthStatus,
} from "$lib/sys/generated/health.types.js";
import { friendlyLabel } from "$lib/sys/boot/boot-labels.js";

export type BootPhase = "initializing" | "ready" | "failed";
export type SubsystemState = "pending" | "loading" | "ready" | "failed";

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
			return "ready";
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
		const total = Math.max(4, this.subsystems.size);
		let ready = 0;
		this.subsystems.forEach((info) => {
			if (info.state === "ready") ready++;
		});
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

	/** Initialize event listeners — call once from root layout. */
	async init(): Promise<void> {
		// Listen for subsystem status events (during boot)
		const unlistenSubsystem = await listen<InitEvent>(
			"platform:subsystem-status",
			(e) => {
				const event = e.payload;
				const existing = this.subsystems.get(event.step);
				const info: SubsystemInfo = {
					name: event.step,
					state: mapInitStatus(event.status),
					latencyMs: event.latency_ms,
					message: event.message,
					friendlyName:
						existing?.friendlyName ??
						friendlyLabel(event.step),
				};
				const next = new Map(this.subsystems);
				next.set(event.step, info);
				this.subsystems = next;
			},
		);
		this.unlisteners.push(unlistenSubsystem);

		// Listen for boot phase transitions
		const unlistenPhase = await listen<{
			phase: BootPhase;
			health?: SystemHealth;
			error?: string;
		}>("platform:boot-phase", (e) => {
			this.phase = e.payload.phase;

			if (e.payload.health) {
				this.health = e.payload.health;
			}
			if (e.payload.error) {
				this.error = e.payload.error;
			}

			// After boot complete, start health polling
			if (e.payload.phase === "ready") {
				this.startHealthPolling();
			}
		});
		this.unlisteners.push(unlistenPhase);
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
