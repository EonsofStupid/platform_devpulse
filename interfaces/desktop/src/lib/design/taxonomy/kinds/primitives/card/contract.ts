/**
 * @file Card Taxonomy Contract
 * @description ColdLight SSOT contract for the card primitive.
 *
 * ariaStateProvider: "coldlight" — semantic grouping container, direct ARIA application.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="group" for semantic content grouping.
 * Cards can be interactive (clickable) with keyboard Enter/Space.
 * Selected state for multi-card selection patterns.
 */

import type { PrimitiveContract } from "../../../types.js";
import { cardSlotStates, type CardSlot, type CardState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Card primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"card", CardSlot, CardState> = {
	kind: "card",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["header", "title", "description", "content", "footer"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label", "aria-labelledby", "aria-describedby", "aria-selected", "aria-disabled"] },
		},
		header: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		title: {
			element: "h3",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		description: {
			element: "p",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		footer: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["selected"],
	},
	slotStates: cardSlotStates,
	slotActions: { root: ["select"], header: [], title: [], description: [], content: [], footer: [] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-selected",
			"aria-disabled",
		],
	},
	keyboard: ["Enter", "Space"],
	focusStrategy: "none",
	compound: false,
};
