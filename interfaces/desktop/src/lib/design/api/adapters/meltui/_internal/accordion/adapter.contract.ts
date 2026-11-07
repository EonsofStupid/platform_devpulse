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
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "accordion",
	source: "meltui",
	meltClass: "Accordion",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ──────────────────────────────────────────────────────────
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

	// ─── Per-Item Slots (compound) ───────────────────────────────────────────
	itemSlots: {
		item: {
			meltGetter: "item",
			coldlightSlot: "item",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: ["expanded", "collapsed", "disabled"],
			dataAttributes: ["data-cl-accordion-item"],
		},
		trigger: {
			meltGetter: "item.trigger",
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
			meltGetter: "item.content",
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

	// ─── Props ───────────────────────────────────────────────────────────────
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
			type: "string | string[]",
			required: false,
		},
		{
			meltProp: "onValueChange",
			coldlightProp: "onValueChange",
			type: "(value: string | string[]) => void",
			required: false,
		},
	],

	// ─── Keyboard ────────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Enter", action: "toggle", description: "Toggle accordion item", slot: "trigger" },
		{ key: "Space", action: "toggle", description: "Toggle accordion item", slot: "trigger" },
		{ key: "ArrowDown", action: "next-item", description: "Move focus to next accordion header", slot: "trigger" },
		{ key: "ArrowUp", action: "prev-item", description: "Move focus to previous accordion header", slot: "trigger" },
		{ key: "Home", action: "first-item", description: "Move focus to first accordion header", slot: "trigger" },
		{ key: "End", action: "last-item", description: "Move focus to last accordion header", slot: "trigger" },
	],
} as const satisfies AdapterContract<"accordion">;
