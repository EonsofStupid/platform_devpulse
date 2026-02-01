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
	slotSpec: {
		root: { element: "div", children: "snippet", aria: { role: "toolbar", required: [], optional: ["aria-label", "aria-labelledby", "aria-orientation"] } },
		group: { element: "div", children: "snippet", aria: { role: "group", required: [], optional: ["aria-label"] } },
		item: { element: "button", children: "snippet", aria: { role: "button", required: [], optional: ["aria-disabled", "aria-pressed", "aria-label"] } },
		separator: { element: "div", children: "snippet", aria: { role: "separator", required: [], optional: ["aria-orientation"] } },
		link: { element: "a", children: "snippet", aria: { role: "link", required: [], optional: ["aria-label", "aria-disabled"] } },
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
	focusStrategy: "roving",
	compound: false,
	orientation: "horizontal",
};
