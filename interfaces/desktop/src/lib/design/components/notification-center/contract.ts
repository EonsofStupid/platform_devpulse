/**
 * @file NotificationCenter Component Contract
 * @kind notification-center
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * NotificationCenter uses role="log" with aria-live="polite" and aria-relevant="additions".
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "notification-center",
	description:
		"Notification center panel with role='log'. Uses aria-live='polite' and aria-relevant='additions' for accessible notification delivery. Supports open/close state via Escape key.",

	slots: {
		required: ["root"],
		optional: ["header", "list", "item", "action", "empty"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "log",
				required: [],
				optional: [
					{ attr: "aria-live", valueType: "aria-live" },
					{ attr: "aria-relevant", valueType: "aria-relevant" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "notification-center",
				slot: "root",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Escape", action: "close", description: "Close notification center" },
			],
		},
		header: {
			name: "header",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "notification-center",
				slot: "header",
				states: [],
			},
		},
		list: {
			name: "list",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "notification-center",
				slot: "list",
				states: [],
			},
		},
		item: {
			name: "item",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "notification-center",
				slot: "item",
				states: [],
			},
		},
		action: {
			name: "action",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "notification-center",
				slot: "action",
				states: [],
			},
		},
		empty: {
			name: "empty",
			element: "div",
			aria: {
				role: "status",
				required: [],
				optional: [],
			},
			data: {
				kind: "notification-center",
				slot: "empty",
				states: [],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [
			{ key: "Escape", action: "close", description: "Close notification center" },
		],
	},

	states: {
		primary: "open",
		all: ["open", "closed"],
		ariaMapping: {},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "notification-center",
} as const satisfies ComponentContract;
