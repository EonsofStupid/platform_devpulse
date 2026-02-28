/**
 * @file Callout Recipe — Shortcode Class Composition
 * @kind visual
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural class (callout) handles layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type CalloutRecipeProps = { variant?: string };

export function calloutRecipe(props: CalloutRecipeProps = {}): string {
	const variantMap: Record<string, string> = {
		default: "v-void s-glass e-0",
		info: "v-cyber s-glass e-0",
		warning: "v-molten s-glass e-0",
		error: "v-molten s-glass e-0",
	};
	return cn(
		"callout",
		"sz-md",
		variantMap[props.variant ?? "default"] ?? variantMap.default,
	);
}
