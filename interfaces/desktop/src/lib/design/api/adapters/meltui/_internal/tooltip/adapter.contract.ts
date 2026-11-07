/**
 * @file Tooltip Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Tooltip → ColdLight tooltip primitive contract.
 * This is the SSOT for how MeltUI's Tooltip class fulfills ColdLight's
 * tooltip primitive specification.
 *
 * Scanner validates this against primitives/tooltip/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "tooltip",
	source: "meltui",
	meltClass: "Tooltip",
	meltImport: "melt/builders",
	compound: true,

	// ─── Slots ──────────────────────────────────────────────────────────────
	slots: {
		trigger: {
			meltGetter: "trigger",
			coldlightSlot: "trigger",
			element: "div",
			aria: {
				required: [],
				optional: ["aria-describedby"],
			},
			states: ["focused", "focus-visible", "hover"],
			dataAttributes: ["data-cl-tooltip-trigger"],
		},
		content: {
			meltGetter: "content",
			coldlightSlot: "content",
			element: "div",
			aria: {
				role: "tooltip",
				required: [],
				optional: [],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-tooltip-content"],
		},
		arrow: {
			meltGetter: "arrow",
			coldlightSlot: "arrow",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-tooltip-arrow"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "openDelay",
			coldlightProp: "openDelay",
			type: "number",
			required: false,
			defaultValue: 1000,
		},
		{
			meltProp: "closeDelay",
			coldlightProp: "closeDelay",
			type: "number",
			required: false,
			defaultValue: 0,
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
			meltProp: "closeOnPointerDown",
			coldlightProp: "closeOnPointerDown",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
		{
			meltProp: "disableHoverableContent",
			coldlightProp: "disableHoverableContent",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "forceVisible",
			coldlightProp: "forceVisible",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "floatingConfig",
			coldlightProp: "floatingConfig",
			type: "object",
			required: false,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Escape", action: "close", description: "Dismiss the tooltip", slot: "trigger" },
	],
} as const satisfies AdapterContract<"tooltip">;
