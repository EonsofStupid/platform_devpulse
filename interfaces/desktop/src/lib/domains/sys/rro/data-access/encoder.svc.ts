/**
 * @file Encoder Service — model-loader IPC, narrowed to the rag.embedder slot.
 * @module @devpulse/domains/sys/rro/data-access
 *
 * The encoder is a model-loader slot (`rag.embedder`). Rather than pulling
 * the entire slots domain in, we narrow it to the one slot this devtool
 * cares about.
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { withRetry } from "$lib/sys/retry.js";
import type { SlotInfo } from "../util/rro.types.js";
import { trace } from "./rro.trace.js";

export const EMBEDDER_SLOT_ID = "rag.embedder" as const;

/** Fetch the encoder slot — returns null if the slot is not configured. */
export async function getEncoderSlot(): Promise<SlotInfo | null> {
	return trace("encoder", "getEncoderSlot", () =>
		withRetry(
			async () => {
				const r = await commands.getSlots();
				if (r.status === "error") throw new Error(r.error);
				return r.data.find((s: SlotInfo) => s.id === EMBEDDER_SLOT_ID) ?? null;
			},
			{ label: "rro.encoder.slot" },
		),
	);
}

/** Encode a text string into a vector — calls the loaded encoder. */
export async function encodeText(text: string): Promise<number[]> {
	return trace("search", "encodeText", async () => {
		const r = await commands.embedText(EMBEDDER_SLOT_ID, text);
		if (r.status === "error") throw new Error(r.error);
		return r.data;
	});
}
