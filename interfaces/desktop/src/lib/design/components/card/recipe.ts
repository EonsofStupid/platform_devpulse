/**
 * @file Card Recipe
 * @kind card
 * @layer components
 *
 * Props → Tailwind v4 utilities (structural) + variant keys (visual).
 */

import { cn } from "$lib/design/utils/cn.js";

type CardRecipeProps = { variant?: string; size?: string };

export function cardRecipe(props: CardRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "p-3",
		md: "p-4",
		lg: "p-6",
	};
	const variantMap: Record<string, string> = {
		default: "v-s1 v-z1 v-l1 border border-border-soft",
		elevated: "v-s3 v-z2 v-l2 border border-border-soft",
		outlined: "v-s1 v-z0 border border-border-subtle",
	};
	return cn(
		"rounded-lg",
		variantMap[props.variant ?? "default"] ?? variantMap.default,
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
