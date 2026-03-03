/**
 * @file primitives/tabs/contract.ts
 * @kind tabs
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tabs PrimitiveContract — SSOT declaration for the tabs primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight builder handles ARIA natively (coldlight/_internal/tabs/).
 *   Complex compound widget with roving tabindex focus management.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TabsSlot, TabsState } from "./types.js";

export const contract = {
	kind: "tabs",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["triggerList", "trigger", "content"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		triggerList: {
			element: "div",
			children: "snippet",
			aria: {
				role: "tablist",
				required: [],
				optional: [],
			},
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "tab",
				required: ["aria-selected", "aria-controls"],
				optional: ["aria-disabled"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "tabpanel",
				required: ["aria-labelledby"],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["selected", "focused", "focus-visible", "hover", "disabled"],
		specific: [],
	},

	slotStates: {
		triggerList: [],
		trigger: ["selected", "focused", "focus-visible", "hover", "disabled"],
		content: ["selected"],
	},

	slotActions: {
		triggerList: [],
		trigger: ["select"],
		content: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "tablist",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-orientation"],
	},

	// ─── Keyboard (WAI-ARIA APG: Tabs) ────────────────────────────────────────
	// ArrowLeft/ArrowRight: move between tabs
	// Home: first tab
	// End: last tab
	// Enter/Space: activate focused tab (manual activation mode)
	keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
} as const satisfies PrimitiveContract<"tabs", TabsSlot, TabsState>;
