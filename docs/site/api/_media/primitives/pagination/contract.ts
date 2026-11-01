/**
 * @file primitives/pagination/contract.ts
 * @kind pagination
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Pagination PrimitiveContract — navigation landmark with page controls.
 *
 * ariaStateProvider: "meltui"
 * Builder: new Pagination()
 * 3-folder parity: primitives/pagination/ + api/adapters/meltui/_internal/pagination/ + components/pagination/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 *
 * ARIA (handled by MeltUI adapter):
 *   root: role="navigation", aria-label
 *   previous: role="button", aria-label, aria-disabled
 *   next: role="button", aria-label, aria-disabled
 *   page: role="button", aria-label, aria-current, aria-disabled
 *   ellipsis: role="presentation"
 *
 * Keyboard:
 *   Enter/Space — activate page button
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { PaginationSlot, PaginationState } from "./types.js";

export const contract = {
	kind: "pagination",
	ariaStateProvider: "meltui",

	slots: {
		required: ["root", "previous", "next", "page"],
		optional: ["ellipsis"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: {
				role: "navigation",
				required: [],
				optional: ["aria-label"],
			},
		},
		previous: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		next: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		page: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-current", "aria-disabled"],
			},
		},
		ellipsis: {
			element: "span",
			children: "snippet",
			aria: {
				role: "presentation",
				required: [],
				optional: [],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible", "disabled"],
		specific: ["selected"],
	},

	slotStates: {
		root: [],
		previous: ["focused", "focus-visible", "disabled"],
		next: ["focused", "focus-visible", "disabled"],
		page: ["selected", "focused", "focus-visible", "disabled"],
		ellipsis: [],
	},

	slotActions: {
		root: [],
		previous: ["select"],
		next: ["select"],
		page: ["select"],
		ellipsis: [],
	},

	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	keyboard: ["Enter", "Space"],
	focusStrategy: "roving",
	compound: true,
} as const satisfies PrimitiveContract<"pagination", PaginationSlot, PaginationState>;
