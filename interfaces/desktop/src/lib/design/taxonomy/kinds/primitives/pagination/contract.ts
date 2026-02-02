/**
 * @file Pagination Taxonomy Contract
 * @description ColdLight SSOT contract for the pagination primitive.
 *
 * ariaStateProvider: "meltui" — createPagination provides ARIA roles and keyboard nav.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * WAI-ARIA: Navigation landmark. role="navigation" on root.
 * Standard button keyboard for items. No special focus management.
 */

import type { PrimitiveContract } from "../../../types.js";
import { paginationSlotStates, type PaginationSlot, type PaginationState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Pagination primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"pagination", PaginationSlot, PaginationState> = {
	kind: "pagination",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "content"],
		optional: ["item", "previous", "next", "ellipsis"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: { role: "navigation", required: [], optional: ["aria-label"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		item: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label", "aria-current", "aria-disabled"] },
		},
		previous: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label", "aria-disabled"] },
		},
		next: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label", "aria-disabled"] },
		},
		ellipsis: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["selected"],
	},
	slotStates: paginationSlotStates,
	slotActions: {
		root: [],
		content: [],
		item: ["select"],
		previous: ["select"],
		next: ["select"],
		ellipsis: [],
	},
	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-current", "aria-disabled"],
	},
	keyboard: ["Enter", "Space"],
	focusStrategy: "none",
	compound: true,
};
