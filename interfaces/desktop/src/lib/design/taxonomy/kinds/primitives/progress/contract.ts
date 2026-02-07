/**
 * @file Progress Taxonomy Contract
 * @description ColdLight SSOT contract for the progress primitive.
 *
 * ariaStateProvider: "coldlight" — native range widget, direct ARIA application.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Meter Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * WAI-ARIA: progressbar is a read-only range widget.
 * aria-valuenow required unless indeterminate.
 * aria-valuemin defaults to 0, aria-valuemax defaults to 100.
 * Accessible name required. Children are presentational.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { progressSlotStates } from "./types.js";

const rawContract = {
	kind: "progress",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "indicator"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "progressbar",
				required: [],
				optional: [
					"aria-valuenow",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuetext",
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
					"aria-busy",
				],
			},
		},
		indicator: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "disabled"],
		specific: ["indeterminate", "loading"],
	},
	slotStates: progressSlotStates,
	slotActions: { root: [], indicator: [] },
	aria: {
		role: "progressbar",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-valuenow",
			"aria-valuemin",
			"aria-valuemax",
			"aria-valuetext",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-busy",
		],
	},
	keyboard: [],
	keyboardMap: [],
	focusStrategy: "none",
	compound: false,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
