/**
 * useAspectRatio — Responsive aspect ratio utility.
 *
 * Returns a Tailwind class string. No inline styles.
 * Uses Tailwind v4 aspect-[n/n] syntax and --size-{token} for max-width.
 */

import { cn } from "#coldlight/utils/cn.js";
import type { UseAspectRatioProps, UseAspectRatioReturn } from "./aspect-ratio.types.js";

export function useAspectRatio(props: UseAspectRatioProps = {}): UseAspectRatioReturn {
	const ratio = props.ratio ?? "16/9";

	const classes = cn(
		`aspect-[${ratio}]`,
		props.maxWidth !== undefined && `max-w-[var(--size-${props.maxWidth})]`,
	);

	return {
		get classes() {
			return classes;
		},
		get ratio() {
			return ratio;
		},
	};
}
