/**
 * @file Breadcrumb Taxonomy Contract
 * @description ColdLight SSOT contract for the breadcrumb primitive.
 *
 * ariaStateProvider: "coldlight" — semantic HTML landmarks + aria-current for current page indication.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: <nav> landmark with aria-label="Breadcrumb".
 * Ordered list (<ol>) structure for sequential navigation.
 * aria-current="page" on the current (last) item.
 * Separators are presentational (aria-hidden).
 */

import type { PrimitiveContract } from "../../../types.js";
import { breadcrumbSlotStates, type BreadcrumbSlot, type BreadcrumbState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Breadcrumb primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"breadcrumb", BreadcrumbSlot, BreadcrumbState> = {
	kind: "breadcrumb",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root", "list", "item"],
		optional: ["link", "separator", "page"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: { role: "navigation", required: [], optional: ["aria-label"] },
		},
		list: {
			element: "ol",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		item: {
			element: "li",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		link: {
			element: "a",
			children: "snippet",
			aria: { required: [], optional: ["aria-current"] },
		},
		separator: {
			element: "span",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: ["aria-hidden"] },
		},
		page: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: ["aria-current"] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: [],
	},
	slotStates: breadcrumbSlotStates,
	slotActions: { root: [], list: [], item: [], link: [], separator: [], page: [] },
	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-current"],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: false,
};
