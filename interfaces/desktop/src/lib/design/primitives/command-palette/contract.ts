/**
 * @file primitives/command-palette/contract.ts
 * @kind command-palette
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Command palette PrimitiveContract — dialog + combobox composition for command search.
 *
 * ariaStateProvider: "coldlight"
 * ColdLight-owned ARIA (builder pending)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { CommandPaletteSlot, CommandPaletteState } from "./types.js";

export const contract = {
	kind: "command-palette",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "input", "list", "item"],
		optional: ["group", "separator", "empty"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "dialog",
				required: ["aria-modal"],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "combobox",
				required: ["aria-expanded", "aria-controls"],
				optional: ["aria-activedescendant", "aria-label", "aria-autocomplete"],
			},
		},
		list: {
			element: "div",
			children: "snippet",
			aria: {
				role: "listbox",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		item: {
			element: "div",
			children: "snippet",
			aria: {
				role: "option",
				required: [],
				optional: ["aria-selected", "aria-disabled"],
			},
		},
		group: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-labelledby"],
			},
		},
		separator: {
			element: "hr",
			children: "self-closing",
			aria: {
				role: "separator",
				required: [],
				optional: [],
			},
		},
		empty: {
			element: "div",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "disabled"],
		specific: ["open", "closed", "selected"],
	},

	slotStates: {
		root: ["open", "closed"],
		input: ["focused", "focus-visible"],
		list: [],
		item: ["selected", "focused", "disabled"],
		group: [],
		separator: [],
		empty: [],
	},

	slotActions: {
		root: ["open", "close", "dismiss"],
		input: ["filter"],
		list: [],
		item: ["select"],
		group: [],
		separator: [],
		empty: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal"],
		optionalAttrs: ["aria-label", "aria-labelledby"],
	},

	// ─── Keyboard (WAI-ARIA APG: Dialog + Combobox) ───────────────────────────
	keyboard: ["Escape", "ArrowDown", "ArrowUp", "Enter"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: {
		escape: true,
		outsideClick: true,
	},
} as const satisfies PrimitiveContract<
	"command-palette",
	CommandPaletteSlot,
	CommandPaletteState
>;
