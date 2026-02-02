/**
 * @file HoverCard Taxonomy Contract
 * @description ColdLight SSOT contract for the hover-card primitive.
 *
 * ariaStateProvider: "meltui" — createLinkPreview provides hover timing, positioning, and dismiss behavior.
 * 2-folder parity: taxonomy + primitive.
 *
 * Supplementary content card shown on hover/focus of a trigger element.
 * Content is non-essential — the trigger (typically a link) remains accessible without it.
 * No specific WAI-ARIA widget role; uses generic tooltip-like pattern.
 */

import type { PrimitiveContract } from "../../../types.js";
import { hoverCardSlotStates, type HoverCardSlot, type HoverCardState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** HoverCard primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"hover-card", HoverCardSlot, HoverCardState> = {
	kind: "hover-card",
	ariaStateProvider: "meltui",
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
	focusStrategy: "redirect",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
};
