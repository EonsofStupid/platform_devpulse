import { definePrimitive } from "../../schema/index.js";

export const badgeSpec = definePrimitive({
	kind: "badge",
	label: "Badge",
	description: "A presentational label for status, counts, or categories.",
	category: "display",
	behaviorHook: "useBadge",
	compound: false,
	a11y: {
		// Slots follow the behavior's anatomy (`behaviors/display/badge/badge.anatomy.ts`).
		slots: {
			root: {
				element: "span",
				role: null,
				ariaAttrs: ["aria-label", "aria-live"],
				description:
					"The badge container; role='status' with aria-live='polite' when its content updates",
			},
			icon: {
				element: "span",
				role: null,
				ariaAttrs: ["aria-hidden"],
				description: "Decorative icon, hidden from assistive technology",
			},
			label: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description:
					"The status text, count or category name; without it the root needs aria-label",
			},
			remove: {
				element: "button",
				role: "button",
				ariaAttrs: ["aria-label"],
				description: "Remove button, present only when the badge is removable",
			},
		},
		keyboard: [
			{ key: "Space", action: "Remove the badge", condition: "focus on the remove button" },
			{ key: "Enter", action: "Remove the badge", condition: "focus on the remove button" },
		],
		focusStrategy: "none",
	},
});
