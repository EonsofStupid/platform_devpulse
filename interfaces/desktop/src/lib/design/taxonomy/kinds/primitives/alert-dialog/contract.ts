/**
 * @file AlertDialog Taxonomy Contract
 * @description ColdLight SSOT contract for the alert-dialog primitive.
 *
 * ariaStateProvider: "coldlight" — dsAdapter (createDialog) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * Reference: W3C WAI-ARIA APG Alert and Message Dialogs
 * https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 *
 * Non-dismissible dialog — Escape does NOT close. User must pick cancel or action.
 */

import { type PrimitiveContract, parseContract } from "../../../primitive/contract.js";
import { alertDialogSlotStates } from "./types.js";

const rawContract = {
	kind: "alert-dialog",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "content", "title", "description"],
		optional: ["trigger", "portal", "overlay", "cancel", "action"],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-haspopup", "aria-expanded"],
				optional: ["aria-controls", "aria-label"],
			},
		},
		portal: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		overlay: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "alertdialog",
				required: ["aria-modal", "aria-labelledby", "aria-describedby"],
				optional: ["aria-label"],
			},
		},
		title: { element: "h2", children: "snippet", aria: { required: [], optional: [] } },
		description: { element: "p", children: "snippet", aria: { required: [], optional: [] } },
		cancel: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label"] },
		},
		action: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: [], optional: ["aria-label"] },
		},
	},
	slotRelationships: [
		{ sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: false },
		{ sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "title", required: true },
		{
			sourceSlot: "content",
			attribute: "aria-describedby",
			targetSlot: "description",
			required: true,
		},
	],
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "open", "entering", "exiting"],
	},
	slotStates: alertDialogSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		portal: [],
		overlay: [],
		content: [],
		title: [],
		description: [],
		cancel: ["dismiss"],
		action: ["close"],
	},
	aria: {
		role: "alertdialog",
		requiredAttrs: ["aria-modal", "aria-labelledby", "aria-describedby"],
		optionalAttrs: ["aria-label", "aria-hidden", "aria-busy"],
	},
	keyboard: ["Tab"],
	keyboardMap: [
		{
			orientation: "both",
			focusLocation: "content",
			key: "Tab",
			action: "next-item",
			required: true,
		},
	],
	focusStrategy: "trap",
	focus: {
		strategy: "trap",
		onOpen: "first-focusable",
		tabBehavior: "cycle-within",
	},
	compound: true,
	dismissBehavior: { escape: false, outsideClick: false },
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
