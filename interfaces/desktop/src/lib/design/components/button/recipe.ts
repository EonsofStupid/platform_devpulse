/**
 * @file Button Recipe — Shortcode Class Composition
 * @kind action
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (btn, btn-{intent}) handle layout + accent + focus/disabled
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - rounded-* for radius (allowed per gold standard)
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type ButtonRecipeProps = { intent?: string; size?: string };

export function buttonRecipe(props: ButtonRecipeProps = {}): string {
	const intentMap: Record<string, string> = {
		primary: "btn btn-primary v-cyber s-glass e-1",
		secondary: "btn btn-secondary v-void s-glass e-0",
		ghost: "btn btn-ghost e-0",
		danger: "btn btn-danger v-molten s-solid e-1",
	};
	const sizeMap: Record<string, string> = {
		sm: "sz-sm rounded-md",
		md: "sz-md rounded-lg",
		lg: "sz-lg rounded-lg",
	};
	return cn(
		intentMap[props.intent ?? "primary"] ?? intentMap.primary,
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
