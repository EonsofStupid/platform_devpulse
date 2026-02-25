/**
 * @file primitives/tags-input/contract.ts
 * @kind tags-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tags Input PrimitiveContract — composite widget with editable tags.
 *
 * ariaStateProvider: "meltui"
 * Builder: new TagsInput()
 * 3-folder parity: primitives/tags-input/ + api/adapters/meltui/_internal/tags-input/ + components/tags-input/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * ARIA (handled by MeltUI adapter):
 *   root: no explicit role, optional aria-labelledby
 *   tag: role="option", aria-selected, aria-disabled
 *   tag-delete: role="button", aria-label
 *   input: role="textbox", aria-label, aria-describedby, aria-invalid, aria-required
 *
 * Keyboard:
 *   Enter — add tag from input
 *   Backspace — select/delete last tag
 *   Delete — delete selected tag
 *   ArrowLeft/ArrowRight — navigate between tags
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TagsInputSlot, TagsInputState } from "./types.js";

export const contract = {
	kind: "tags-input",
	ariaStateProvider: "meltui",

	slots: {
		required: ["root", "tag", "tag-delete", "input"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-labelledby"],
			},
		},
		tag: {
			element: "span",
			children: "snippet",
			aria: {
				role: "option",
				required: [],
				optional: ["aria-selected", "aria-disabled"],
			},
		},
		"tag-delete": {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "textbox",
				required: [],
				optional: ["aria-label", "aria-describedby", "aria-invalid", "aria-required"],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible", "disabled", "invalid"],
		specific: ["selected"],
	},

	slotStates: {
		root: ["focused", "focus-visible", "disabled", "invalid"],
		tag: ["selected", "focused", "disabled"],
		"tag-delete": ["focused", "focus-visible"],
		input: ["focused", "focus-visible", "disabled", "invalid"],
	},

	slotActions: {
		root: [],
		tag: ["select", "deselect"],
		"tag-delete": ["dismiss"],
		input: [],
	},

	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: ["aria-labelledby", "aria-label"],
	},

	keyboard: ["Enter", "Backspace", "Delete", "ArrowLeft", "ArrowRight"],
	focusStrategy: "roving",
	compound: true,
} as const satisfies PrimitiveContract<"tags-input", TagsInputSlot, TagsInputState>;
