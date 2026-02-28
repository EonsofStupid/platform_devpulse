/**
 * @file Card Recipe — Shortcode Class Composition
 * @kind visual
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural class (card) handles padding/border-radius
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type CardRecipeProps = { variant?: string; size?: string };

export function cardRecipe(props: CardRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	const variantMap: Record<string, string> = {
		default: "v-void s-glass e-2",
		elevated: "v-void s-glass e-3",
		outlined: "v-void s-glass e-0",
	};
	return cn(
		"card",
		variantMap[props.variant ?? "default"] ?? variantMap.default,
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
