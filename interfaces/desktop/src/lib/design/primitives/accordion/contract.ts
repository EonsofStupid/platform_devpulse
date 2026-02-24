/**
 * @file primitives/accordion/contract.ts
 * @kind accordion
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Accordion PrimitiveContract — expandable content sections.
 *
 * ariaStateProvider: "meltui"
 * Builder: new Accordion()
 * 3-folder parity: primitives/accordion/ + api/adapters/meltui/_internal/accordion/ + components/accordion/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 *
 * ARIA (handled by MeltUI adapter):
 *   trigger: role="button", aria-expanded, aria-controls → content
 *   content: role="region", aria-labelledby → trigger
 *
 * Keyboard:
 *   Enter/Space — toggle section
 *   ArrowDown — next trigger
 *   ArrowUp — prev trigger
 *   Home — first trigger
 *   End — last trigger
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { AccordionSlot, AccordionState } from "./types.js";

export const contract = {
	kind: "accordion",
	ariaStateProvider: "meltui",

	slots: {
		required: ["root", "item", "trigger", "content"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		item: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-expanded", "aria-controls"],
				optional: ["aria-disabled"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "region",
				required: ["aria-labelledby"],
				optional: [],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["expanded", "collapsed"],
	},

	slotStates: {
		root: [],
		item: ["expanded", "collapsed", "disabled"],
		trigger: ["expanded", "focused", "focus-visible", "hover", "disabled"],
		content: ["expanded", "collapsed"],
	},

	slotActions: {
		root: [],
		item: ["expand", "collapse", "toggle"],
		trigger: ["toggle"],
		content: [],
	},

	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: [],
	},

	keyboard: ["Enter", "Space", "ArrowDown", "ArrowUp", "Home", "End"],
	focusStrategy: "roving",
	compound: true,
	orientation: "vertical",
} as const satisfies PrimitiveContract<"accordion", AccordionSlot, AccordionState>;
