/**
 * @file sys/runes/bootState.svelte.ts
 * @module @devpulse/sys/runes/bootState
 * @description Reactive boot progress state using Svelte 5 runes.
 * Collects InitEvents emitted by Platform::boot() via Tauri event bridge.
 * Consumed by the splashscreen route to render real-time boot progress.
 */

import type { InitEvent } from "$lib/sys/generated/init.types.js";

class BootState {
	events = $state<InitEvent[]>([]);
	complete = $state(false);
	error = $state<string | null>(null);
	firstEventTime = $state<number | null>(null);

	get currentStep(): string | null {
		const running = this.events.filter((e) => e.status === "Running");
		return running.length > 0 ? running[running.length - 1].step : null;
	}

	get completedSteps(): InitEvent[] {
		return this.events.filter((e) => e.status === "Ok");
	}

	get failedSteps(): InitEvent[] {
		return this.events.filter((e) => e.status === "Error");
	}

	get hasErrors(): boolean {
		return this.failedSteps.length > 0;
	}

	get progress(): number {
		// Unique step names that have completed
		const uniqueCompleted = new Set(
			this.events
				.filter((e) => e.status === "Ok" || e.status === "Skipped")
				.map((e) => e.step),
		);
		// Unique step names seen (all statuses)
		const uniqueTotal = new Set(this.events.map((e) => e.step));
		const total = Math.max(5, uniqueTotal.size);
		return Math.round((uniqueCompleted.size / total) * 100);
	}

	get totalLatencyMs(): number {
		return this.events
			.filter((e) => e.latency_ms !== null)
			.reduce((sum, e) => sum + (e.latency_ms ?? 0), 0);
	}

	addEvent(event: InitEvent): void {
		if (this.firstEventTime === null) {
			this.firstEventTime = Date.now();
		}
		this.events.push(event);

		// Track errors
		if (event.status === "Error") {
			this.error = event.message ?? `${event.step} failed`;
		}
	}

	markComplete(): void {
		this.complete = true;
	}
}

export const bootState = new BootState();
