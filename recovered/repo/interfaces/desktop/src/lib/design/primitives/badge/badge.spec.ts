import { definePrimitive } from "../../schema/index.js";

export const badgeSpec = definePrimitive({
	kind: "badge",
	label: "Badge",
	description: "A presentational label for status, counts, or categories.",
	category: "display",
	behaviorHook: "useBadge",
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "span",
				role: "presentation",
				ariaAttrs: ["aria-hidden"],
				description: "The badge container element",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});
