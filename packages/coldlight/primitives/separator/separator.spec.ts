import { definePrimitive } from "../../schema/index.js";

export const separatorSpec = definePrimitive({
	kind: "separator",
	label: "Separator",
	description:
		"A horizontal rule element with native separator semantics and aria-orientation support.",
	category: "layout",
	behaviorHook: null,
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "hr",
				role: "separator",
				ariaAttrs: ["aria-orientation"],
				container: false,
				description: "Thematic break or visual divider between content sections",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});
