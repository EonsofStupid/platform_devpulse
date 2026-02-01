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
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["open", "closed"],
	},
	slotStates: collapsibleSlotStates,
	slotActions: { root: [], trigger: ["toggle"], content: [] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-expanded", "aria-controls", "aria-disabled"],
	},
	keyboard: ["Enter", "Space"],
};
