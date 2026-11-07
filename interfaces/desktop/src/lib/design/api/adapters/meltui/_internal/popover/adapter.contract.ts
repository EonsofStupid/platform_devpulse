/**
 * @file Popover Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Popover → ColdLight popover primitive contract.
 * This is the SSOT for how MeltUI's Popover class fulfills ColdLight's
 * popover primitive specification.
 *
 * Scanner validates this against primitives/popover/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: Non-modal dialog pattern
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "popover",
	source: "meltui",
	meltClass: "Popover",
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
				required: [],
				optional: ["aria-haspopup", "aria-expanded", "aria-controls"],
			},
			states: ["focused", "focus-visible"],
			dataAttributes: ["data-cl-popover-trigger"],
		},
		content: {
			meltGetter: "content",
			coldlightSlot: "content",
			element: "div",
			aria: {
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-popover-content"],
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
			dataAttributes: ["data-cl-popover-arrow"],
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
			meltProp: "forceVisible",
			coldlightProp: "forceVisible",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "sameWidth",
			coldlightProp: "sameWidth",
			type: "boolean",
			required: false,
			defaultValue: false,
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
			defaultValue: true,
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
		{ key: "Escape", action: "close", description: "Close the popover", slot: "content" },
		{ key: "Tab", action: "focus-trap", description: "Move focus within the popover", slot: "content" },
	],
} as const satisfies AdapterContract<"popover">;
