/**
 * @file Toolbar Taxonomy Contract
 * @description ColdLight SSOT contract for the toolbar primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import {
	toolbarSlotStates,
	type ToolbarSlot,
	type ToolbarState,
} from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Toolbar primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<
	"toolbar",
	ToolbarSlot,
	ToolbarState
> = {
	kind: "toolbar",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["group", "item", "separator", "link"],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: [],
	},
	slotStates: toolbarSlotStates,
	slotActions: {
		root: [],
		group: [],
		item: [],
		separator: [],
		link: [],
	},
	aria: {
		role: "toolbar",
		requiredAttrs: ["aria-label"],
		optionalAttrs: ["aria-orientation", "aria-controls", "aria-disabled"],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Tab"],
};
