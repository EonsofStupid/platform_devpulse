/**
 * @file Select Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Select → ColdLight select primitive contract.
 * This is the SSOT for how MeltUI's Select class fulfills ColdLight's
 * select primitive specification.
 *
 * Scanner validates this against primitives/select/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "select",
	source: "meltui",
	meltClass: "Select",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ─────────────────────────────────────────────────────────
	slots: {
		trigger: {
			meltGetter: "trigger",
			coldlightSlot: "trigger",
			element: "button",
			aria: {
				role: "combobox",
				required: ["aria-expanded", "aria-haspopup"],
				optional: ["aria-label", "aria-labelledby", "aria-disabled", "aria-controls"],
			},
			states: ["open", "focused", "focus-visible", "hover", "disabled"],
			dataAttributes: ["data-cl-select-trigger"],
		},
		content: {
			meltGetter: "content",
			coldlightSlot: "content",
			element: "div",
			aria: {
				role: "listbox",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-select-content"],
		},
		label: {
			meltGetter: "label",
			coldlightSlot: "label",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			states: ["disabled"],
			dataAttributes: ["data-cl-select-label"],
		},
	},

	// ─── Per-Item Slots (compound) ──────────────────────────────────────────
	itemSlots: {
		option: {
			meltGetter: "getOption",
			coldlightSlot: "option",
			element: "div",
			aria: {
				role: "option",
				required: ["aria-selected"],
				optional: ["aria-disabled"],
			},
			states: ["selected", "focused", "hover", "disabled"],
			dataAttributes: ["data-cl-select-option"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "value",
			coldlightProp: "value",
			type: "T | undefined",
			required: false,
		},
		{
			meltProp: "onValueChange",
			coldlightProp: "onValueChange",
			type: "(value: T | undefined) => void",
			required: false,
		},
		{
			meltProp: "open",
			coldlightProp: "open",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "onOpenChange",
			coldlightProp: "onOpenChange",
			type: "(open: boolean) => void",
			required: false,
		},
		{
			meltProp: "floatingConfig",
			coldlightProp: "floatingConfig",
			type: "object",
			required: false,
		},
		{
			meltProp: "typeaheadTimeout",
			coldlightProp: "typeaheadTimeout",
			type: "number",
			required: false,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "ArrowDown", action: "next-option", description: "Open listbox or move to next option", slot: "trigger" },
		{ key: "ArrowUp", action: "prev-option", description: "Open listbox or move to previous option", slot: "trigger" },
		{ key: "Home", action: "first-option", description: "Move to first option", slot: "trigger" },
		{ key: "End", action: "last-option", description: "Move to last option", slot: "trigger" },
		{ key: "Enter", action: "select", description: "Select focused option", slot: "trigger" },
		{ key: "Space", action: "select", description: "Select focused option or open listbox", slot: "trigger" },
		{ key: "Escape", action: "close", description: "Close listbox", slot: "trigger" },
		{ key: "Tab", action: "accept-and-blur", description: "Accept current value and move focus", slot: "trigger" },
	],
} as const satisfies AdapterContract<"select">;
