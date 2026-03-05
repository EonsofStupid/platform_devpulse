/**
 * @file Progress Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Progress → ColdLight progress primitive contract.
 * This is the SSOT for how MeltUI's Progress class fulfills ColdLight's
 * progress primitive specification.
 *
 * Scanner validates this against primitives/progress/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WIRING STATUS:
 * - Component at components/progress/ EXISTS with Progress.svelte, contract.ts, recipe.ts, etc.
 * - Component currently manages ARIA directly: hardcodes role="progressbar", aria-valuenow,
 *   aria-valuemin, aria-valuemax on the root div, and aria-hidden on indicator.
 *   It does NOT consume the MeltUI transport.
 * - TO WIRE: Component should import createProgressTransport from the transport layer,
 *   spread transport.slots.root onto the root div (melt provides role, aria-valuenow,
 *   aria-valuemin, aria-valuemax automatically), spread transport.slots.indicator onto
 *   the indicator div, and use transport.states.value for the progress value.
 *   Remove hardcoded ARIA attrs from the template — transport handles them.
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "progress",
	source: "meltui",
	meltClass: "Progress",
	meltImport: "melt/builders",
	compound: false,

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				role: "progressbar",
				required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-label", "aria-labelledby", "aria-valuetext"],
			},
			states: [],
			dataAttributes: ["data-cl-progress-root"],
		},
		indicator: {
			meltGetter: "progress",
			coldlightSlot: "indicator",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-progress-indicator"],
		},
	},

	// ─── Props ───────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "value",
			coldlightProp: "value",
			type: "number",
			required: false,
		},
		{
			meltProp: "max",
			coldlightProp: "max",
			type: "number",
			required: false,
			defaultValue: 100,
		},
	],

	// ─── Keyboard (Progress: no keyboard interaction) ────────────────────────
	keyboard: [],
} as const satisfies AdapterContract<"progress">;
