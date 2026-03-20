/**
 * useBadge — ColdLight badge primitive hook.
 *
 * Presentational: role="presentation". No interactive ARIA.
 * Provides context data attributes for variant/size/fill styling.
 *
 * S2 pattern: Badge uses Provider to pass TextContext + IconContext to children.
 * Our equivalent: data attributes + Svelte context for child slot styling.
 */

import { badgeAnatomy } from "./badge.anatomy.js";
import type { UseBadgeProps, UseBadgeReturn } from "./badge.types.js";

export function useBadge(props: UseBadgeProps = {}): UseBadgeReturn {
	const variant = props.variant ?? "neutral";
	const fillStyle = props.fillStyle ?? "bold";
	const size = props.size ?? "md";
	const decorative = props.decorative ?? false;

	const root = $derived({
		...badgeAnatomy.attrs.root,
		role: "presentation" as const,
		"aria-hidden": decorative ? ("true" as const) : undefined,
		"data-variant": variant,
		"data-fill": fillStyle,
		"data-size": size,
	});

	return {
		get root() {
			return root;
		},
	};
}
