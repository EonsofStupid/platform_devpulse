/**
 * @file Avatar Taxonomy Contract
 * @description ColdLight SSOT contract for the avatar primitive.
 *
 * ariaStateProvider: "coldlight" — image element with fallback, direct ARIA application.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="img" for the avatar container.
 * Accessible name via aria-label for non-decorative avatars.
 * Image slot is self-closing. Fallback shown when image fails/loading.
 */

import type { PrimitiveContract } from "../../../types.js";
import { avatarSlotStates, type AvatarSlot, type AvatarState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Avatar primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"avatar", AvatarSlot, AvatarState> = {
	kind: "avatar",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["image", "fallback"],
		forbidden: [],
	},
	slotSpec: {
		root: {
			element: "span",
			children: "snippet",
			aria: { role: "img", required: [], optional: ["aria-label", "aria-hidden"] },
		},
		image: {
			element: "img",
			children: "self-closing",
			aria: { required: [], optional: [] },
		},
		fallback: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
	},
	states: {
		shared: ["hover", "active"],
		specific: ["loading", "hidden", "visible"],
	},
	slotStates: avatarSlotStates,
	slotActions: { root: [], image: [], fallback: [] },
	aria: {
		role: "img",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-hidden"],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: false,
};
