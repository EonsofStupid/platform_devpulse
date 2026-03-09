/**
 * @file Accordion Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 *
 * UNIFIED schema for the MeltUI Accordion adapter.
 * Declares slots, states, ARIA, interactions AND the full MeltUI → ColdLight mapping.
 * Replaces the old adapter.contract.ts + schema.ts split.
 *
 * Build-time: Zod validates via AdapterSchemaZ.parse()
 * Compile-time: TypeScript enforces via `satisfies ComponentSchema`
 * Runtime: JSON-serializable for VPB introspection
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const AccordionSchema = {
	kind: "accordion",
	engine: "meltui",
	slots: ["root", "item", "trigger", "content"],
	states: ["expanded", "collapsed", "disabled"],
	aria: ["aria-expanded", "aria-controls", "aria-labelledby", "aria-disabled", "aria-level"],
	interactions: ["click", "keydown"],

	meltui: {
		meltClass: "Accordion",
		meltImport: "melt/builders",
		compound: true,

		slotMapping: {
			root: {
				meltGetter: "root",
				coldlightSlot: "root",
				element: "div",
				aria: { required: [], optional: [] },
				states: [],
				dataAttributes: ["data-cl-accordion-root"],
			},
		},

		itemSlotMapping: {
			item: {
				meltGetter: "heading",
				coldlightSlot: "item",
				element: "div",
				aria: {
					role: "heading",
					required: [],
					optional: ["aria-level"],
				},
				states: ["expanded", "collapsed", "disabled"],
				dataAttributes: ["data-cl-accordion-item"],
			},
			trigger: {
				meltGetter: "trigger",
				coldlightSlot: "trigger",
				element: "button",
				aria: {
					role: "button",
					required: ["aria-expanded", "aria-controls"],
					optional: ["aria-disabled"],
				},
				states: ["expanded", "focused", "focus-visible", "hover", "disabled"],
				dataAttributes: ["data-cl-accordion-trigger"],
			},
			content: {
				meltGetter: "content",
				coldlightSlot: "content",
				element: "div",
				aria: {
					role: "region",
					required: ["aria-labelledby"],
					optional: [],
				},
				states: ["expanded", "collapsed"],
				dataAttributes: ["data-cl-accordion-content"],
			},
		},

		propMapping: [
			{ meltProp: "multiple", coldlightProp: "multiple", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "disabled", coldlightProp: "disabled", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "value", coldlightProp: "value", type: "string | Set<string>", required: false },
			{ meltProp: "onValueChange", coldlightProp: "onValueChange", type: "(value: string | Set<string>) => void", required: false },
		],

		keyboardMapping: [
			{ key: "Enter", action: "toggle", description: "Toggle accordion section", slot: "trigger" },
			{ key: "Space", action: "toggle", description: "Toggle accordion section", slot: "trigger" },
			{ key: "ArrowDown", action: "focusNext", description: "Focus next trigger", slot: "trigger" },
			{ key: "ArrowUp", action: "focusPrev", description: "Focus previous trigger", slot: "trigger" },
			{ key: "Home", action: "focusFirst", description: "Focus first trigger", slot: "trigger" },
			{ key: "End", action: "focusLast", description: "Focus last trigger", slot: "trigger" },
		],
	},
} as const;
