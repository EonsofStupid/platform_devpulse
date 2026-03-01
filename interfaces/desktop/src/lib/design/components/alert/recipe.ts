/**
 * @file Alert Recipe — Shortcode Class Composition
 * @kind feedback
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (alert, alert-{intent}) handle layout + accent
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type AlertRecipeProps = { intent?: string };

export function alertRecipe(props: AlertRecipeProps = {}): string {
	const intentMap: Record<string, string> = {
		info: cn("alert", "alert-info", "v-s1", "v-d1", "sz-md", "rounded-lg"),
		success: cn("alert", "alert-success", "v-s1", "v-d1", "sz-md", "rounded-lg"),
		warning: cn("alert", "alert-warning", "v-s1", "v-d1", "v-g3", "sz-md", "rounded-lg"),
		error: cn("alert", "alert-error", "v-s1", "v-d1", "v-g3", "sz-md", "rounded-lg"),
	};
	return intentMap[props.intent ?? "info"] ?? intentMap.info;
}
