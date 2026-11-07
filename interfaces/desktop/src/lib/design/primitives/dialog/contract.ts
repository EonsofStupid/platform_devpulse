/**
 * @file primitives/dialog/contract.ts
 * @kind dialog
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Dialog PrimitiveContract — modal dialog overlay.
 *
 * ariaStateProvider: "meltui"
 * Builder: new Dialog() (melt/builders)
 * 3-folder parity: primitives/dialog/ + api/adapters/meltui/_internal/dialog/ + components/dialog/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * ARIA: role="dialog", aria-modal, aria-labelledby, aria-describedby
 * Keyboard: Escape (close), Tab (cycle within trap)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DialogSlot, DialogState } from "./types.js";

export const contract = {
	kind: "dialog",
	ariaStateProvider: "meltui",

	slots: {
		required: ["trigger", "content"],
		optional: ["overlay", "title", "description", "close"],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-haspopup", "aria-expanded", "aria-controls"],
			},
		},
		overlay: {
			element: "div",
			children: "self-closing",
			aria: { required: [], optional: [] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "dialog",
				required: ["aria-modal"],
				optional: ["aria-labelledby", "aria-describedby", "aria-label"],
			},
		},
		title: {
			element: "h2",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		description: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		close: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible"],
		specific: ["open", "closed"],
	},

	slotStates: {
		trigger: ["focused", "focus-visible"],
		overlay: ["open", "closed"],
		content: ["open", "closed"],
		title: [],
		description: [],
		close: ["focused", "focus-visible"],
	},

	slotActions: {
		trigger: ["open"],
		overlay: [],
		content: [],
		title: [],
		description: [],
		close: ["close"],
	},

	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal"],
		optionalAttrs: ["aria-labelledby", "aria-describedby", "aria-label"],
	},

	keyboard: ["Escape", "Tab"],
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const satisfies PrimitiveContract<"dialog", DialogSlot, DialogState>;
