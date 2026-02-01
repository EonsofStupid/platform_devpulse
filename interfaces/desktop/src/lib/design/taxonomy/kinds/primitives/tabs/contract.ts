/**
 * @file Tabs Taxonomy Contract
 * @description ColdLight SSOT contract for the tabs primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state machinery.
 * 3-folder parity: taxonomy + adapter + primitive.
 *
 * CRITICAL: MeltUI tabs trigger/content are parameterized builders.
 * trigger(value) and content(value) return stores, unlike dialog where
 * all elements are direct stores. This affects primitive implementation.
 */

import type { PrimitiveContract } from "../../../types.js";
import { tabsSlotStates, type TabsSlot, type TabsState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Tabs primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"tabs", TabsSlot, TabsState> = {
	kind: "tabs",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "list", "trigger", "content"],
		optional: [],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		list: { element: "div", children: "snippet", aria: { role: "tablist", required: ["aria-orientation"], optional: ["aria-label", "aria-labelledby"] } },
		trigger: { element: "button", children: "snippet", aria: { role: "tab", required: ["aria-selected", "aria-controls"], optional: ["aria-disabled"] } },
		content: { element: "div", children: "snippet", aria: { role: "tabpanel", required: ["aria-labelledby"], optional: ["aria-hidden"] } },
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"],
		specific: ["hidden", "visible", "selected"],
	},
	slotStates: tabsSlotStates,
	slotActions: {
		root: [],
		list: [],
		trigger: ["select"],
		content: [],
	},
	aria: {
		role: "tablist",
		requiredAttrs: ["aria-orientation"],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-disabled",
			"aria-describedby",
			"aria-selected",
			"aria-controls",
		],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"],
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
};
