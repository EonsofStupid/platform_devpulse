/**
 * @file Accordion Taxonomy Contract
 * @description ColdLight SSOT contract for the accordion primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import {
	accordionSlotStates,
	type AccordionSlot,
	type AccordionState,
} from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Accordion primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<
	"accordion",
	AccordionSlot,
	AccordionState
> = {
	kind: "accordion",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "item", "trigger", "content"],
		optional: ["header"],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["open", "closed"],
	},
	slotStates: accordionSlotStates,
	slotActions: {
		root: [],
		item: [],
		header: [],
		trigger: ["toggle"],
		content: [],
	},
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-expanded",
			"aria-controls",
			"aria-disabled",
			"aria-labelledby",
			"aria-label",
			"aria-hidden",
			"aria-orientation",
		],
	},
	keyboard: ["Enter", "Space", "ArrowUp", "ArrowDown", "Home", "End"],
};
