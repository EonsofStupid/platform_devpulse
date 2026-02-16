/**
 * @file Checkbox Taxonomy Contract
 * @description ColdLight SSOT contract for the checkbox primitive.
 *
 * ariaStateProvider: "coldlight" — native <button> with role="checkbox" + aria-checked at component layer.
 * 2-folder parity: taxonomy + primitive.
 *
 * Reference: W3C WAI-ARIA APG Checkbox Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * WAI-ARIA: role="checkbox" supports tri-state (true/false/mixed).
 * aria-checked required. "mixed" = indeterminate state for parent checkboxes.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { checkboxSlotStates } from "./types.js";

const rawContract = {
	kind: "checkbox",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: ["indicator"], forbidden: [] },
	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "checkbox",
				required: ["aria-checked"],
				optional: [
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
					"aria-disabled",
					"aria-required",
					"aria-invalid",
				],
			},
		},
		indicator: {
			element: "span",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["checked", "indeterminate"],
	},
	slotStates: checkboxSlotStates,
	slotActions: { root: ["check", "uncheck", "toggle"], indicator: [] },
	aria: {
		role: "checkbox",
		requiredAttrs: ["aria-checked"],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-disabled",
			"aria-required",
			"aria-invalid",
		],
	},
	keyboard: ["Space"],
	keyboardMap: [
		{ orientation: "both", focusLocation: "root", key: "Space", action: "toggle", required: true },
	],
	focusStrategy: "none",
	compound: true,
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
