/**
 * useDivider — Token-backed visual separator utility.
 *
 * Returns a Tailwind class string + ARIA attributes object.
 * No inline styles. Spacing via --space-{token} arbitrary values.
 */

import { cn } from "#coldlight/utils/cn.js";
import type { UseDividerAttrs, UseDividerProps, UseDividerReturn } from "./divider.types.js";

export function useDivider(props: UseDividerProps = {}): UseDividerReturn {
	const orientation = props.orientation ?? "horizontal";
	const decorative = props.decorative ?? false;

	const isHorizontal = orientation === "horizontal";

	const classes = isHorizontal
		? cn(
				"w-full",
				"border-t",
				"border-border-subtle",
				props.spacing !== undefined && `my-${props.spacing}`,
			)
		: cn(
				"h-full",
				"border-l",
				"border-border-subtle",
				props.spacing !== undefined && `mx-${props.spacing}`,
			);

	const attrs: UseDividerAttrs = decorative
		? { role: "none" as const, "aria-hidden": "true" as const }
		: { role: "separator" as const, "aria-orientation": orientation };

	return {
		get classes() {
			return classes;
		},
		get attrs() {
			return attrs;
		},
	};
}
