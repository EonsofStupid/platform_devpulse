/**
 * @file primitives/link-preview/contract.ts
 * @kind link-preview
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Link Preview PrimitiveContract — tooltip-like hover preview.
 *
 * ariaStateProvider: "meltui"
 * Builder: new LinkPreview()
 * 3-folder parity: primitives/link-preview/ + api/adapters/meltui/_internal/link-preview/ + components/link-preview/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 *
 * ARIA (handled by MeltUI adapter):
 *   trigger: role="link", aria-describedby → content
 *   content: role="tooltip", aria-label
 *
 * Keyboard:
 *   Escape — dismiss preview
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { LinkPreviewSlot, LinkPreviewState } from "./types.js";

export const contract = {
	kind: "link-preview",
	ariaStateProvider: "meltui",

	slots: {
		required: ["trigger", "content"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "a",
			children: "snippet",
			aria: {
				role: "link",
				required: [],
				optional: ["aria-describedby"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "tooltip",
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
		content: ["open", "closed"],
	},

	slotActions: {
		trigger: ["open"],
		content: ["close"],
	},

	aria: {
		role: "tooltip",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	keyboard: ["Escape"],
	focusStrategy: "none",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const satisfies PrimitiveContract<"link-preview", LinkPreviewSlot, LinkPreviewState>;
