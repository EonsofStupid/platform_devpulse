/**
 * @file ScrollArea Taxonomy Contract
 * @description ColdLight SSOT contract for the scroll-area primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import {
	scrollAreaSlotStates,
	type ScrollAreaSlot,
	type ScrollAreaState,
} from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** ScrollArea primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<
	"scroll-area",
	ScrollAreaSlot,
	ScrollAreaState
> = {
	kind: "scroll-area",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "viewport"],
		optional: ["scrollbar", "thumb", "corner"],
		forbidden: [],
	},
	states: { shared: ["hover", "active"], specific: ["visible", "hidden"] },
	slotStates: scrollAreaSlotStates,
	slotActions: {
		root: [],
		viewport: [],
		scrollbar: [],
		thumb: [],
		corner: [],
	},
	aria: {
		role: "region",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-orientation"],
	},
	keyboard: [
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"PageUp",
		"PageDown",
		"Home",
		"End",
	],
};
