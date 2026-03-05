/**
 * @file Radio Group Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI RadioGroup → ColdLight radio-group primitive contract.
 * This is the SSOT for how MeltUI's RadioGroup class fulfills ColdLight's
 * radio-group primitive specification.
 *
 * Scanner validates this against primitives/radio-group/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "radio-group",
	source: "meltui",
	meltClass: "RadioGroup",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ─────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				role: "radiogroup",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-orientation", "aria-required"],
			},
			states: [],
			dataAttributes: ["data-cl-radio-group-root"],
		},
	},

	// ─── Per-Item Slots (compound) ──────────────────────────────────────────
	itemSlots: {
		item: {
			meltGetter: "getItem",
			coldlightSlot: "item",
			element: "button",
			aria: {
				role: "radio",
				required: ["aria-checked"],
				optional: ["aria-disabled", "aria-label"],
			},
			states: ["checked", "focused", "focus-visible", "hover", "disabled"],
			dataAttributes: ["data-cl-radio-group-item"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "value",
			coldlightProp: "value",
			type: "string",
			required: false,
		},
		{
			meltProp: "onValueChange",
			coldlightProp: "onValueChange",
			type: "(value: string) => void",
			required: false,
		},
		{
			meltProp: "disabled",
			coldlightProp: "disabled",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "required",
			coldlightProp: "required",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "loop",
			coldlightProp: "loop",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
		{
			meltProp: "selectWhenFocused",
			coldlightProp: "selectWhenFocused",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
		{
			meltProp: "orientation",
			coldlightProp: "orientation",
			type: "'horizontal' | 'vertical'",
			required: false,
			defaultValue: "vertical",
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "ArrowDown", action: "next-item", description: "Move focus to next radio and select", slot: "item" },
		{ key: "ArrowUp", action: "prev-item", description: "Move focus to previous radio and select", slot: "item" },
		{ key: "ArrowLeft", action: "prev-item", description: "Move focus to previous radio and select", slot: "item" },
		{ key: "ArrowRight", action: "next-item", description: "Move focus to next radio and select", slot: "item" },
		{ key: "Space", action: "select", description: "Select focused radio", slot: "item" },
	],
} as const satisfies AdapterContract<"radio-group">;
