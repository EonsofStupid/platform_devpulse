/**
 * @file Narration State Rune — Clyffy speaks about model events.
 * @module @devpulse/domains/app/models/runes/narration
 *
 * Listens to Tauri model events and generates plain-English messages.
 * Each card filters by its slot ID. Messages auto-clear after 8 seconds.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";

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
					text: "Loading up — pulling model weights into memory...",
					type: "info",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string; stage: string; progress: number }>(
				"model:loading-stage",
				(e) => {
					const stage = e.payload.stage;
					const pct = Math.round(e.payload.progress);
					let text = `Loading... ${pct}%`;
					if (stage === "Verifying") text = "Checking the model file...";
					else if (stage === "Allocating") text = "Reserving memory on your graphics card...";
					else if (stage === "LoadingWeights") text = `Loading the brain — ${pct}% done...`;
					else if (stage === "LoadingTokenizer") text = "Setting up the language processor...";
					else if (stage === "WarmingUp") text = "Almost ready — warming up...";

					this.push({
						slotId: e.payload.slot_id,
						text,
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
					text: "Ready to go! Model is loaded and active.",
					type: "success",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string; error: string }>("model:loading-failed", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: `Couldn't load the model — ${e.payload.error}`,
					type: "error",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ download_id: string; repo_id: string }>("model:download-started", () => {
				this.push({
					slotId: "*",
					text: `Downloading from HuggingFace — sit tight...`,
					type: "info",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ download_id: string }>("model:download-complete", () => {
				this.push({
					slotId: "*",
					text: "Download complete! Model is ready to activate.",
					type: "success",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ download_id: string; error: string }>("model:download-failed", (e) => {
				this.push({
					slotId: "*",
					text: `Download failed — ${e.payload.error}`,
					type: "error",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string }>("model:swap-started", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: "Switching models — Clyffy will pause briefly...",
					type: "info",
					timestamp: Date.now(),
				});
			}),
		);

		this.unlisteners.push(
			await listen<{ slot_id: string }>("model:swap-complete", (e) => {
				this.push({
					slotId: e.payload.slot_id,
					text: "Model switched! Back online.",
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
