/**
 * useSpacer — Flexible spacer element with DTCG token-backed sizing.
 *
 * Returns a Tailwind class string. No inline styles.
 * Width/height reference --space-{token} CSS custom properties via arbitrary value syntax.
 */

import { cn } from "$lib/design/utils/cn.js";
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
				parts.push(`w-[var(--space-${token})]`);
				parts.push(`min-w-[var(--space-${token})]`);
				break;
			case "y":
				parts.push(`h-[var(--space-${token})]`);
				parts.push(`min-h-[var(--space-${token})]`);
				break;
			case "both":
				parts.push(`w-[var(--space-${token})]`);
				parts.push(`h-[var(--space-${token})]`);
				parts.push(`min-w-[var(--space-${token})]`);
				parts.push(`min-h-[var(--space-${token})]`);
				break;
		}
	}

	return {
		get classes() {
			return cn(...parts);
		},
	};
}
