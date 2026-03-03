/**
 * @file Combobox Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Combobox → ColdLight combobox primitive contract.
 * This is the SSOT for how MeltUI's Combobox class fulfills ColdLight's
 * combobox primitive specification.
 *
 * Scanner validates this against primitives/combobox/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "combobox",
	source: "meltui",
	meltClass: "Combobox",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ─────────────────────────────────────────────────────────
	slots: {
		input: {
			meltGetter: "input",
			coldlightSlot: "input",
			element: "input",
			aria: {
				role: "combobox",
				required: ["aria-expanded", "aria-controls", "aria-autocomplete"],
				optional: ["aria-activedescendant", "aria-label", "aria-labelledby", "aria-describedby", "aria-invalid", "aria-required"],
			},
			states: ["focused", "focus-visible", "disabled"],
			dataAttributes: ["data-cl-combobox-input"],
		},
		trigger: {
			meltGetter: "trigger",
			coldlightSlot: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
			states: ["open", "focused", "hover"],
			dataAttributes: ["data-cl-combobox-trigger"],
		},
		content: {
			meltGetter: "content",
			coldlightSlot: "content",
			element: "div",
			aria: {
				role: "listbox",
				required: [],
				optional: ["aria-label"],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-combobox-content"],
		},
		label: {
			meltGetter: "label",
			coldlightSlot: "label",
			element: "label",
			aria: {
				required: [],
				optional: [],
			},
			states: ["disabled"],
			dataAttributes: ["data-cl-combobox-label"],
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
			dataAttributes: ["data-cl-combobox-option"],
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
			meltProp: "inputValue",
			coldlightProp: "inputValue",
			type: "string",
			required: false,
		},
		{
			meltProp: "onInputValueChange",
			coldlightProp: "onInputValueChange",
			type: "(value: string) => void",
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
			meltProp: "highlighted",
			coldlightProp: "highlighted",
			type: "T | null",
			required: false,
		},
		{
			meltProp: "onHighlightChange",
			coldlightProp: "onHighlightChange",
			type: "(value: T | null) => void",
			required: false,
		},
		{
			meltProp: "closeOnEscape",
			coldlightProp: "closeOnEscape",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
		{
			meltProp: "closeOnOutsideClick",
			coldlightProp: "closeOnOutsideClick",
			type: "boolean",
			required: false,
		},
		{
			meltProp: "sameWidth",
			coldlightProp: "sameWidth",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
		{
			meltProp: "scrollAlignment",
			coldlightProp: "scrollAlignment",
			type: "string",
			required: false,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "ArrowDown", action: "next-option", description: "Open listbox or move to next option", slot: "input" },
		{ key: "ArrowUp", action: "prev-option", description: "Open listbox or move to previous option", slot: "input" },
		{ key: "Home", action: "first-option", description: "Move to first option", slot: "input" },
		{ key: "End", action: "last-option", description: "Move to last option", slot: "input" },
		{ key: "Enter", action: "select", description: "Accept focused option", slot: "input" },
		{ key: "Escape", action: "close", description: "Close listbox", slot: "input" },
		{ key: "Tab", action: "accept-and-blur", description: "Accept current value and move focus", slot: "input" },
	],
} as const satisfies AdapterContract<"combobox">;
