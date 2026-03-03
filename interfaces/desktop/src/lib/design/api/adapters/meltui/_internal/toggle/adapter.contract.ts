/**
 * @file Toggle Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Toggle → ColdLight toggle primitive contract.
 * This is the SSOT for how MeltUI's Toggle class fulfills ColdLight's
 * toggle primitive specification.
 *
 * Scanner validates this against primitives/toggle/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "toggle",
	source: "meltui",
	meltClass: "Toggle",
	meltImport: "melt/builders",
	compound: false,

	// ─── Slots ──────────────────────────────────────────────────────────────
	slots: {
		trigger: {
			meltGetter: "trigger",
			coldlightSlot: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: ["aria-pressed"],
				optional: ["aria-label", "aria-disabled"],
			},
			states: ["pressed", "focused", "focus-visible", "hover", "disabled"],
			dataAttributes: ["data-cl-toggle-trigger"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "value",
			coldlightProp: "pressed",
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
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Enter", action: "toggle", description: "Toggle the pressed state", slot: "trigger" },
		{ key: "Space", action: "toggle", description: "Toggle the pressed state", slot: "trigger" },
	],
} as const satisfies AdapterContract<"toggle">;
