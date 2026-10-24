/**
 * useSpacer — Flexible spacer element with DTCG token-backed sizing.
 *
 * Returns a Tailwind class string. No inline styles.
 * Width/height use Tailwind v4 --spacing-* theme utilities (no arbitrary syntax needed).
 */

import { cn } from "#coldlight/utils/cn.js";
import type { UseSpacerProps, UseSpacerReturn } from "./spacer.types.js";

export function useSpacer(props: UseSpacerProps = {}): UseSpacerReturn {
	const axis = props.axis ?? "y";
	const grow = props.grow ?? false;

	const parts: (string | false | undefined)[] = [];

	if (grow) {
		parts.push("flex-grow");
	}

	if (props.size !== undefined) {
		const token = props.size;

		switch (axis) {
			case "x":
				parts.push(`w-${token}`);
				parts.push(`min-w-${token}`);
				break;
			case "y":
				parts.push(`h-${token}`);
				parts.push(`min-h-${token}`);
				break;
			case "both":
				parts.push(`w-${token}`);
				parts.push(`h-${token}`);
				parts.push(`min-w-${token}`);
				parts.push(`min-h-${token}`);
				break;
		}
	}

	return {
		get classes() {
			return cn(...parts);
		},
	};
}
