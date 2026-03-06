/**
 * @file Dialog Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Dialog → ColdLight dialog primitive contract.
 * This is the SSOT for how MeltUI's Dialog class fulfills ColdLight's
 * dialog primitive specification.
 *
 * Scanner validates this against primitives/dialog/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "dialog",
	source: "meltui",
	meltClass: "Dialog",
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
			dataAttributes: ["data-cl-dialog-trigger"],
		},
		content: {
			meltGetter: "content",
			coldlightSlot: "content",
			element: "div",
			aria: {
				role: "dialog",
				required: ["aria-modal"],
				optional: ["aria-labelledby", "aria-describedby", "aria-label"],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-dialog-content"],
		},
		overlay: {
			meltGetter: "overlay",
			coldlightSlot: "overlay",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-dialog-overlay"],
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
			meltProp: "scrollLock",
			coldlightProp: "scrollLock",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Escape", action: "close", description: "Close the dialog", slot: "content" },
		{ key: "Tab", action: "trap", description: "Cycle focus within dialog", slot: "content" },
	],
} as const satisfies AdapterContract<"dialog">;
