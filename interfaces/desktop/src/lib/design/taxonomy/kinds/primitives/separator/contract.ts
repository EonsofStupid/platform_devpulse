/**
 * @file Separator Taxonomy Contract
 * @description ColdLight SSOT contract for the separator primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import {
	separatorSlotStates,
	type SeparatorSlot,
	type SeparatorState,
} from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Separator primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<
	"separator",
	SeparatorSlot,
	SeparatorState
> = {
	kind: "separator",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: [],
	},
	slotStates: separatorSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "separator",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-orientation",
			"aria-disabled",
			"aria-valuemin",
			"aria-valuemax",
			"aria-valuenow",
			"aria-valuetext",
		],
	},
	keyboard: [
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"Home",
		"End",
	],
};
