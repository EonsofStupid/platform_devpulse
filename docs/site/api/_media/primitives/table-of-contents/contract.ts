/**
 * @file primitives/table-of-contents/contract.ts
 * @kind table-of-contents
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * TableOfContents PrimitiveContract — navigation list of document headings.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TableOfContentsSlot, TableOfContentsState } from "./types.js";

export const contract = {
	kind: "table-of-contents",
	ariaStateProvider: "coldlight",

	slots: { required: ["root", "item", "link"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: {
				role: "navigation",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		item: {
			element: "li",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		link: {
			element: "a",
			children: "snippet",
			aria: {
				role: "link",
				required: [],
				optional: ["aria-current"],
			},
		},
	},

	states: { shared: ["focused", "focus-visible"], specific: ["active"] },

	slotStates: {
		root: [],
		item: ["active"],
		link: ["focused", "focus-visible", "active"],
	},

	slotActions: {
		root: [],
		item: [],
		link: ["select"],
	},

	aria: { role: "navigation", requiredAttrs: [], optionalAttrs: ["aria-label", "aria-labelledby"] },
	keyboard: ["Enter"],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"table-of-contents", TableOfContentsSlot, TableOfContentsState>;
