/**
 * @file narrationState — short Clyffy-voice lines per slot.
 * @module @devpulse/domains/app/models/data-access/narration-state
 *
 * Buckets the most recent narration line per slot id. Subscribes to
 * the `model:narration` event the kernel emits during slot lifecycle
 * transitions (loading, ready, swap, failure). Consumers (chat strip,
 * model event card) read `forSlot(slotId)` to render the line.
 *
 * One line per slot — newer lines replace older. The kernel decides
 * what's worth narrating; the rune just stores the most recent.
 */

import { listen } from "@tauri-apps/api/event";
import type { SlotNarration } from "../util/types.js";

interface NarrationPayload {
	slot_id: string;
	line: string;
	tone?: "info" | "success" | "warning" | "error";
	emitted_at_ms?: number;
}

class NarrationState {
	private lines = $state<Record<string, SlotNarration>>({});
	private booted = false;

	/** Subscribe to narration events. Idempotent — call from boot. */
	async boot(): Promise<void> {
		if (this.booted) return;
		this.booted = true;

		await listen<NarrationPayload>("model:narration", (event) => {
			const p = event.payload;
			this.lines = {
				...this.lines,
				[p.slot_id]: {
					slotId: p.slot_id,
					line: p.line,
					tone: p.tone ?? "info",
					emittedAtMs: p.emitted_at_ms ?? Date.now(),
				},
			};
		});
	}

	/** Most recent narration line for a slot, or `null` if none seen. */
	forSlot(slotId: string): SlotNarration | null {
		return this.lines[slotId] ?? null;
	}

	/** Imperative clear — used after a UI element acknowledges a line. */
	clear(slotId: string): void {
		if (!(slotId in this.lines)) return;
		const next = { ...this.lines };
		delete next[slotId];
		this.lines = next;
	}
}

export const narrationState = new NarrationState();
