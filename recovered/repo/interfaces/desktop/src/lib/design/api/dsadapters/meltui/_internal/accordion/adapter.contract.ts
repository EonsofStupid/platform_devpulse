/**
 * @file Accordion Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Accordion → ColdLight accordion primitive contract.
 * This is the SSOT for how MeltUI's Accordion class fulfills ColdLight's
 * accordion primitive specification.
 *
 * Scanner validates this against primitives/accordion/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "accordion",
	source: "meltui",
	meltClass: "Accordion",
	meltImport: "melt/builders",
	compound: true,

	// ─── Slots (root-level) ─────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-accordion-root"],
		},
	},

	// ─── Item Slots (per accordion item via getItem()) ──────────────────────
	itemSlots: {
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

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "multiple",
			coldlightProp: "multiple",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "disabled",
			coldlightProp: "disabled",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "value",
			coldlightProp: "value",
			type: "string | Set<string>",
			required: false,
		},
		{
			meltProp: "onValueChange",
			coldlightProp: "onValueChange",
			type: "(value: string | Set<string>) => void",
			required: false,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Enter", action: "toggle", description: "Toggle accordion section", slot: "trigger" },
		{ key: "Space", action: "toggle", description: "Toggle accordion section", slot: "trigger" },
		{ key: "ArrowDown", action: "focusNext", description: "Focus next trigger", slot: "trigger" },
		{ key: "ArrowUp", action: "focusPrev", description: "Focus previous trigger", slot: "trigger" },
		{ key: "Home", action: "focusFirst", description: "Focus first trigger", slot: "trigger" },
		{ key: "End", action: "focusLast", description: "Focus last trigger", slot: "trigger" },
	],
} as const satisfies AdapterContract<"accordion">;
