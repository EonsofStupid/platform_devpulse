/**
 * @file Collapsible Taxonomy Contract
 * @description ColdLight SSOT contract for the collapsible primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import {
	collapsibleSlotStates,
	type CollapsibleSlot,
	type CollapsibleState,
} from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Collapsible primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<
	"collapsible",
	CollapsibleSlot,
	CollapsibleState
> = {
	kind: "collapsible",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "trigger", "content"],
		optional: [],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: ["aria-expanded", "aria-controls"], optional: ["aria-disabled", "aria-label"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["open", "closed"],
	},
	slotStates: collapsibleSlotStates,
	slotActions: { root: [], trigger: ["toggle"], content: [] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-expanded", "aria-controls", "aria-disabled", "aria-hidden"],
	},
	keyboard: ["Enter", "Space"],
	focusStrategy: "none",
	compound: true,
};
