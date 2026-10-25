/**
 * @file Collapsible Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Collapsible → ColdLight collapsible primitive contract.
 * This is the SSOT for how MeltUI's Collapsible class fulfills ColdLight's
 * collapsible primitive specification.
 *
 * Scanner validates this against primitives/collapsible/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "collapsible",
	source: "meltui",
	meltClass: "Collapsible",
	meltImport: "melt/builders",
	compound: true,

	// ─── Slots ──────────────────────────────────────────────────────────────
	slots: {
		trigger: {
			meltGetter: "trigger",
			coldlightSlot: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: ["aria-expanded", "aria-controls"],
				optional: ["aria-disabled"],
			},
			states: ["open", "focused", "focus-visible", "hover", "disabled"],
			dataAttributes: ["data-cl-collapsible-trigger"],
		},
		content: {
			meltGetter: "content",
			coldlightSlot: "content",
			element: "div",
			aria: {
				role: "region",
				required: [],
				optional: ["aria-labelledby"],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-collapsible-content"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
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
			meltProp: "disabled",
			coldlightProp: "disabled",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Enter", action: "toggle", description: "Toggle collapsible content", slot: "trigger" },
		{ key: "Space", action: "toggle", description: "Toggle collapsible content", slot: "trigger" },
	],
} as const satisfies AdapterContract<"collapsible">;
