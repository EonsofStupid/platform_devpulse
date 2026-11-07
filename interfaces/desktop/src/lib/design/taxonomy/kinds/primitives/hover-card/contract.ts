/**
 * @file HoverCard Taxonomy Contract
 * @description ColdLight SSOT contract for the hover-card primitive.
 *
 * ariaStateProvider: "coldlight" — createLinkPreview provides hover timing, positioning, and dismiss behavior.
 * 2-folder parity: taxonomy + primitive.
 *
 * Supplementary content card shown on hover/focus of a trigger element.
 * Content is non-essential — the trigger (typically a link) remains accessible without it.
 */

import { type PrimitiveContract, parseContract } from "../../../schema.js";
import { hoverCardSlotStates } from "./types.js";

const rawContract = {
	kind: "hover-card",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "trigger", "content"], optional: ["arrow"], forbidden: [] },
	slotSpec: {
		root: {
			element: "fragment",
			children: "renderless",
			aria: { required: [], optional: [] },
		},
		trigger: {
			element: "a",
			children: "snippet",
			aria: { required: [], optional: ["aria-haspopup", "aria-expanded"] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-label"] },
		},
		arrow: {
			element: "div",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover"],
		specific: ["open", "closed"],
	},
	slotStates: hoverCardSlotStates,
	slotActions: { root: ["open", "close"], trigger: [], content: [], arrow: [] },
	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: ["aria-haspopup", "aria-expanded", "aria-label"],
	},
	keyboard: ["Escape"],
	keyboardMap: [
		{
			orientation: "both",
			focusLocation: "trigger",
			key: "Escape",
			action: "close",
			required: true,
		},
	],
	focusStrategy: "redirect",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const;

export const contract: PrimitiveContract = parseContract(rawContract);
