/**
 * @file sys/runes/health.svelte.ts
 * @module @devpulse/sys/runes/health
 * @description Reactive platform health state using Svelte 5 runes.
 * Polls get_status() IPC and exposes real-time health to all consumers.
 */

import { invoke } from "@tauri-apps/api/core";
import type {
	SystemHealth,
	HealthStatus,
} from "$lib/sys/generated/health.types.js";

const POLL_INTERVAL_MS = 15_000;
const INITIAL_DELAY_MS = 1_000;

class PlatformHealth {
	current = $state<SystemHealth | null>(null);
	initialized = $state(false);
	error = $state<string | null>(null);

	get status(): HealthStatus {
		return this.current?.status ?? "Unknown";
	}

	get isHealthy(): boolean {
		return this.status === "Healthy";
	}

	get connectionStatus(): "online" | "offline" | "hybrid" {
		if (!this.initialized) return "offline";
		switch (this.current?.status) {
			case "Healthy":
				return "online";
			case "Degraded":
				return "hybrid";
			default:
				return "offline";
		}
	}

	get uptimeFormatted(): string {
		if (!this.current) return "--";
		const secs = this.current.uptime_secs;
		const days = Math.floor(secs / 86400);
		const hours = Math.floor((secs % 86400) / 3600);
		const minutes = Math.floor((secs % 3600) / 60);
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}

	async refresh(): Promise<void> {
		try {
			const health = await invoke<SystemHealth>("get_status");
			this.current = health;
			this.error = null;
			this.initialized = true;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		}
	}

	private intervalId: ReturnType<typeof setInterval> | null = null;

	startPolling(): void {
		if (this.intervalId !== null) return;
		setTimeout(() => {
			this.refresh();
		}, INITIAL_DELAY_MS);
		this.intervalId = setInterval(() => {
			this.refresh();
		}, POLL_INTERVAL_MS);
	}

	stopPolling(): void {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
}

export const platformHealth = new PlatformHealth();
