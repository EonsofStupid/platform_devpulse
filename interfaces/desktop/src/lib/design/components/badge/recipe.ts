/**
 * @file Badge Recipe — Shortcode Class Composition
 * @kind display
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (badge, badge-{intent}) handle layout + accent
 *   - Shortcode classes (v-*, s-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type BadgeRecipeProps = { intent?: string; size?: string };

export function badgeRecipe(props: BadgeRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-xs",
		md: "sz-sm",
		lg: "sz-md",
	};
	const intentMap: Record<string, string> = {
		neutral: "badge v-s1",
		primary: "badge badge-primary v-s1 v-g6",
		success: "badge badge-success v-s4",
		warning: "badge badge-warning v-s1 v-g3",
		danger: "badge badge-danger v-s1 v-g3",
	};
	return cn(
		intentMap[props.intent ?? "neutral"] ?? intentMap.neutral,
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
