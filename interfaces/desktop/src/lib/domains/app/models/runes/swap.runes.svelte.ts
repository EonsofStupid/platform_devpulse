/**
 * @file Swap State Rune
 * @module @devpulse/domains/app/models/runes/swap
 *
 * Tracks model load/unload operations. Drives the full-screen SwapOverlay.
 * Only active during model weight operations — everything else runs normally.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type SwapOperation = "load" | "unload";

class SwapState {
	/** Whether a swap operation is in progress. */
	active = $state(false);
	/** Which slot is being loaded/unloaded. */
	slotId = $state<string | null>(null);
	/** Current operation type. */
	operation = $state<SwapOperation | null>(null);
	/** Current loading stage name (Verifying, Allocating, LoadingWeights, etc). */
	stage = $state<string | null>(null);
	/** Progress 0-100. */
	progress = $state(0);
	/** Failure message — shown until user dismisses. */
	error = $state<string | null>(null);

	private unlisteners: UnlistenFn[] = [];

	/** Begin tracking a load operation. Shows the overlay. */
	startLoad(slotId: string): void {
		this.active = true;
		this.slotId = slotId;
		this.operation = "load";
		this.stage = "Preparing";
		this.progress = 0;
		this.error = null;
	}

	/** Begin tracking an unload operation. Shows the overlay. */
	startUnload(slotId: string): void {
		this.active = true;
		this.slotId = slotId;
		this.operation = "unload";
		this.stage = "Releasing memory";
		this.progress = 50;
		this.error = null;
	}

	/** Update stage from Tauri event. */
	updateStage(stage: string, progress: number): void {
		this.stage = stage;
		this.progress = Math.min(progress, 100);
	}

	/** Operation completed successfully. Hides overlay. */
	complete(): void {
		this.active = false;
		this.slotId = null;
		this.operation = null;
		this.stage = null;
		this.progress = 0;
		this.error = null;
	}

	/** Operation failed. Overlay stays visible with error until dismissed. */
	fail(error: string): void {
		this.error = error;
		this.stage = null;
		this.progress = 0;
		// active stays true — user must dismiss the error
	}

	/** User acknowledged the error. Hides overlay. */
	dismiss(): void {
		this.active = false;
		this.slotId = null;
		this.operation = null;
		this.stage = null;
		this.progress = 0;
		this.error = null;
	}

	/** Subscribe to Tauri model loading events. Call once on mount. */
	async startListening(): Promise<void> {
		try {
			this.unlisteners.push(
				await listen<{ slot_id: string; stage: string; progress: number }>(
					"model:loading-stage",
					(event) => {
						if (this.active && event.payload.slot_id === this.slotId) {
							this.updateStage(event.payload.stage, event.payload.progress);
						}
					},
				),
			);

			this.unlisteners.push(
				await listen<{ slot_id: string }>("model:loading-complete", (event) => {
					if (this.active && event.payload.slot_id === this.slotId) {
						this.complete();
					}
				}),
			);

			this.unlisteners.push(
				await listen<{ slot_id: string; error: string }>("model:loading-failed", (event) => {
					if (this.active && event.payload.slot_id === this.slotId) {
						this.fail(event.payload.error);
					}
				}),
			);

			this.unlisteners.push(
				await listen<{ slot_id: string }>("model:unload-complete", (event) => {
					if (this.active && event.payload.slot_id === this.slotId) {
						this.complete();
					}
				}),
			);
		} catch (e) {
			console.error("[SwapState] Failed to register event listeners:", e);
		}
	}

	/** Unsubscribe from all Tauri events. Call on unmount. */
	stopListening(): void {
		this.unlisteners.forEach((fn) => {
			fn();
		});
		this.unlisteners = [];
	}
}

export const swapState = new SwapState();
