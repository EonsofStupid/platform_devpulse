/**
 * @file Accordion Component Contract
 * @kind accordion
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * MeltUI transport adapter provides ARIA attributes for trigger/content slots.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Reference: W3C WAI-ARIA APG Accordion Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Accordion component contract — compile-time enforced.
 *
 * Compound component: root → item → (trigger + content)
 * Two context layers: root transport + per-item transport.
 */
export const contract = {
	kind: "accordion",
	description:
		"Vertically stacked set of interactive headings that each reveal an associated section of content. Supports single and multiple expansion modes.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",

	slots: {
		required: ["root", "item", "trigger", "content"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "accordion",
				slot: "root",
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
				kind: "accordion",
				slot: "item",
				states: ["open", "closed"],
			},
		},
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
				optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
			},
			data: {
				kind: "accordion",
				slot: "trigger",
				states: ["expanded", "collapsed", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle accordion item" },
				{ key: "Space", action: "toggle", description: "Toggle accordion item" },
				{
					key: "ArrowDown",
					action: "next-item",
					description: "Move focus to next accordion header",
				},
				{
					key: "ArrowUp",
					action: "prev-item",
					description: "Move focus to previous accordion header",
				},
				{ key: "Home", action: "first-item", description: "Move focus to first accordion header" },
				{ key: "End", action: "last-item", description: "Move focus to last accordion header" },
			],
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "region",
				required: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
				optional: [],
				relationships: [
					{
						attr: "aria-labelledby",
						targetSlot: "trigger",
						required: true,
					},
				],
			},
			data: {
				kind: "accordion",
				slot: "content",
				states: ["open", "closed"],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "roving",
	},

	keyboard: {
		global: [
			{ key: "ArrowDown", action: "next-item", description: "Move focus to next accordion header" },
			{
				key: "ArrowUp",
				action: "prev-item",
				description: "Move focus to previous accordion header",
			},
			{ key: "Home", action: "first-item", description: "Move focus to first accordion header" },
			{ key: "End", action: "last-item", description: "Move focus to last accordion header" },
			{ key: "Enter", action: "toggle", description: "Toggle accordion item" },
			{ key: "Space", action: "toggle", description: "Toggle accordion item" },
		],
	},

	states: {
		primary: "expanded",
		all: ["expanded", "collapsed", "disabled"],
		ariaMapping: {
			expanded: "aria-expanded",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "accordion",
} as const satisfies ComponentContract;
