/**
 * @file Tabs Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Tabs → ColdLight tabs primitive contract.
 * This is the SSOT for how MeltUI's Tabs class fulfills ColdLight's
 * tabs primitive specification.
 *
 * Scanner validates this against primitives/tabs/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "tabs",
	source: "meltui",
	meltClass: "Tabs",
	meltImport: "melt/builders",
	compound: true,

	// ─── Slots ──────────────────────────────────────────────────────────────
	slots: {
		triggerList: {
			meltGetter: "triggerList",
			coldlightSlot: "triggerList",
			element: "div",
			aria: {
				role: "tablist",
				required: [],
				optional: ["aria-orientation"],
			},
			states: [],
			dataAttributes: ["data-cl-tabs-trigger-list"],
		},
	},

	// ─── Item Slots (per tab via getTrigger/getContent) ─────────────────────
	itemSlots: {
		trigger: {
			meltGetter: "getTrigger",
			coldlightSlot: "trigger",
			element: "button",
			aria: {
				role: "tab",
				required: ["aria-selected", "aria-controls"],
				optional: ["aria-disabled"],
			},
			states: ["selected", "focused", "focus-visible", "hover", "disabled"],
			dataAttributes: ["data-cl-tabs-trigger"],
		},
		content: {
			meltGetter: "getContent",
			coldlightSlot: "content",
			element: "div",
			aria: {
				role: "tabpanel",
				required: ["aria-labelledby"],
				optional: [],
			},
			states: ["selected"],
			dataAttributes: ["data-cl-tabs-content"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "value",
			coldlightProp: "value",
			type: "string",
			required: true,
		},
		{
			meltProp: "onValueChange",
			coldlightProp: "onValueChange",
			type: "(value: string) => void",
			required: false,
		},
		{
			meltProp: "orientation",
			coldlightProp: "orientation",
			type: '"horizontal" | "vertical"',
			required: false,
			defaultValue: "horizontal",
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
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "ArrowLeft", action: "focusPrev", description: "Focus previous tab (horizontal)", slot: "trigger" },
		{ key: "ArrowRight", action: "focusNext", description: "Focus next tab (horizontal)", slot: "trigger" },
		{ key: "Home", action: "focusFirst", description: "Focus first tab", slot: "trigger" },
		{ key: "End", action: "focusLast", description: "Focus last tab", slot: "trigger" },
		{ key: "Enter", action: "select", description: "Activate focused tab (manual mode)", slot: "trigger" },
		{ key: "Space", action: "select", description: "Activate focused tab (manual mode)", slot: "trigger" },
	],
} as const satisfies AdapterContract<"tabs">;
