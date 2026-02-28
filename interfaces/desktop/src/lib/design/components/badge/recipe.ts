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
		neutral: "badge v-void s-glass",
		primary: "badge badge-primary v-cyber s-glass",
		success: "badge badge-success v-glacial s-glass",
		warning: "badge badge-warning v-molten s-glass",
		danger: "badge badge-danger v-molten s-glass",
	};
	return cn(
		intentMap[props.intent ?? "neutral"] ?? intentMap.neutral,
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
