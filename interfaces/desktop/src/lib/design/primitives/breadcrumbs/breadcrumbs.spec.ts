import { definePrimitive } from "../../schema/index.js";

export const breadcrumbsSpec = definePrimitive({
	kind: "breadcrumbs",
	label: "Breadcrumbs",
	description: "A navigation trail showing the current page location within a hierarchy.",
	category: "navigation",
	behaviorHook: "useBreadcrumbs",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "nav",
				role: "navigation",
				ariaAttrs: ["aria-label"],
				description: "Navigation landmark containing the breadcrumb trail",
			},
			list: {
				element: "ol",
				role: null,
				ariaAttrs: [],
				description: "Ordered list of breadcrumb items",
			},
			item: {
				element: "li",
				role: null,
				ariaAttrs: [],
				description: "A single breadcrumb entry in the trail",
			},
			link: {
				element: "a",
				role: null,
				ariaAttrs: ["aria-current"],
				description: "Navigation link within a breadcrumb item",
			},
			separator: {
				element: "span",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "Visual separator between breadcrumb items",
			},
		},
		keyboard: [],
		focusStrategy: "none",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/",
	},
});
