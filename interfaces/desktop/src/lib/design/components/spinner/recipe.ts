/**
 * @file Spinner Recipe — Shortcode Composition
 * @kind spinner
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural class (spinner-root) handles animation and sizing.
 * Size is controlled by sz-* shortcode classes which set --recipe-icon-size.
 */

import { cn } from "$lib/design/utils/cn.js";

type SpinnerRecipeProps = { size?: string };

export function spinnerRecipe(props: SpinnerRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"spinner-root",
		`sz-${size}`,
	);
}
