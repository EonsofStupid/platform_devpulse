/**
 * @file Banner Component Contract
 * @kind banner
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Banner is a sticky/fixed layout container for site-wide announcements,
 * marketing CTAs, cookie consent, and persistent notifications.
 *
 * NOT an alert — Banner has no role="alert", no assertive live region.
 * For inline contextual feedback, see Alert.
 *
 * Reference: WAI-ARIA complementary landmark
 * https://www.w3.org/TR/wai-aria-1.2/#complementary
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "banner",
	description:
		"Sticky/fixed layout container for site-wide announcements, marketing CTAs, cookie consent, and persistent notifications. Positioned at viewport top or bottom. Dismissible with transition support. NOT an alert — use Alert for inline contextual feedback.",

	slots: {
		required: ["root"],
		optional: ["dismiss"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "complementary",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "banner",
				slot: "root",
				states: ["open", "closed"],
			},
		},
		dismiss: {
			name: "dismiss",
			element: "button",
			aria: {
				required: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
				optional: [],
			},
			data: {
				kind: "banner",
				slot: "dismiss",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["open", "closed"],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "banner",
} as const satisfies ComponentContract;
