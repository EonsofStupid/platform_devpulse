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
	slotSpec: {
		root: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		viewport: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		scrollbar: { element: "div", children: "snippet", aria: { role: "scrollbar", required: ["aria-controls", "aria-valuenow", "aria-valuemin", "aria-valuemax"], optional: ["aria-orientation"] } },
		thumb: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		corner: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
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
		optionalAttrs: [
			"aria-label",
			"aria-orientation",
			"aria-valuenow",
			"aria-valuemin",
			"aria-valuemax",
			"aria-controls",
		],
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
	focusStrategy: "none",
	compound: false,
	orientation: "both",
};
