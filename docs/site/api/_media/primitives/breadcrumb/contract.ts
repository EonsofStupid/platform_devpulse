/**
 * @file primitives/breadcrumb/contract.ts
 * @kind breadcrumb
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Breadcrumb PrimitiveContract — SSOT declaration for the breadcrumb primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/breadcrumb/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { BreadcrumbSlot, BreadcrumbState } from "./types.js";

export const contract = {
	kind: "breadcrumb",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["item", "separator"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: {
				role: "navigation",
				required: [],
				optional: ["aria-label"],
			},
		},
		item: {
			element: "li",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		separator: {
			element: "span",
			children: "snippet",
			aria: {
				role: "presentation",
				required: [],
				optional: ["aria-hidden"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: [],
		specific: [],
	},

	slotStates: {
		root: [],
		item: [],
		separator: [],
	},

	slotActions: {
		root: [],
		item: [],
		separator: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	// No keyboard — links are natively focusable
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"breadcrumb", BreadcrumbSlot, BreadcrumbState>;
