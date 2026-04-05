/**
 * @file Narration State Rune — Clyffy speaks about model events.
 * @module @devpulse/domains/app/models/runes/narration
 *
 * Listens to Tauri model events and generates plain-English messages.
 * Each card filters by its slot ID. Messages auto-clear after 8 seconds.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { competencyTracker } from "../services/competency.service.js";
import { translateLoadingStage, translateNarrationEvent } from "../utils/terminology.js";

export interface NarrationMessage {
	slotId: string;
	text: string;
	type: "info" | "success" | "warning" | "error";
	timestamp: number;
}

class NarrationState {
	messages = $state<NarrationMessage[]>([]);
	private unlisteners: UnlistenFn[] = [];
	private clearTimers: ReturnType<typeof setTimeout>[] = [];

	/** Get the latest message for a specific slot. */
	forSlot(slotId: string): NarrationMessage | null {
		return this.messages.findLast((m) => m.slotId === slotId) ?? null;
	}

	/** Push a new narration message. Auto-clears after 8 seconds. */
	private push(msg: NarrationMessage): void {
		this.messages = [...this.messages.slice(-9), msg];
		const timer = setTimeout(() => {
			this.messages = this.messages.filter((m) => m !== msg);
		}, 8000);
		this.clearTimers.push(timer);
	}

	/** Start listening to Tauri model events. Call once on mount. */
	async startListening(): Promise<void> {
		this.stopListening();

		this.unlisteners.push(
			await listen<{ slot_id: string; model_id: string }>("model:loading-started", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: translateNarrationEvent(
						"loading-started",
						e.payload.slot_id,
						competencyTracker.level,
					),
					type: "info",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string; stage: string; progress: number }>(
				"model:loading-stage",
				(e) => {
					const pct = Math.round(e.payload.progress);
					this.push({
						slotId: e.payload.slot_id,
						text: translateLoadingStage(e.payload.stage, pct, competencyTracker.level),
						type: "info",
						timestamp: Date.now(),
					});
				},
			),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string }>("model:loading-complete", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: translateNarrationEvent(
						"loading-complete",
						e.payload.slot_id,
						competencyTracker.level,
					),
					type: "success",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string; error: string }>("model:loading-failed", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: translateNarrationEvent(
						"loading-failed",
						e.payload.slot_id,
						competencyTracker.level,
						e.payload.error,
					),
					type: "error",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ download_id: string; repo_id: string }>("model:download-started", () => {
				this.push({
					slotId: "*",
					text: translateNarrationEvent("download-started", "*", competencyTracker.level),
					type: "info",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ download_id: string }>("model:download-complete", () => {
				this.push({
					slotId: "*",
					text: translateNarrationEvent("download-complete", "*", competencyTracker.level),
					type: "success",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ download_id: string; error: string }>("model:download-failed", (e) => {
				this.push({
					slotId: "*",
					text: translateNarrationEvent(
						"download-failed",
						"*",
						competencyTracker.level,
						e.payload.error,
					),
					type: "error",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string }>("model:swap-started", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: translateNarrationEvent("swap-started", e.payload.slot_id, competencyTracker.level),
					type: "info",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string }>("model:swap-complete", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: translateNarrationEvent(
						"swap-complete",
						e.payload.slot_id,
						competencyTracker.level,
					),
					type: "success",
					timestamp: Date.now(),
				});
			}),
		);
	}

	/** Stop listening. Call on unmount. */
	stopListening(): void {
		this.unlisteners.forEach((fn) => {
			fn();
		});
		this.unlisteners = [];
		this.clearTimers.forEach((t) => {
			clearTimeout(t);
		});
		this.clearTimers = [];
	}
}

export const narrationState = new NarrationState();
