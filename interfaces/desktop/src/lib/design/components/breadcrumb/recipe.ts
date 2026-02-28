/**
 * @file Breadcrumb Recipe — Shortcode Class Composition
 * @kind navigation
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural class (breadcrumb) handles layout/positioning
 *   - sz-* shortcodes handle size scaling
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type BreadcrumbRecipeProps = { size?: string };

export function breadcrumbRecipe(props: BreadcrumbRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-xs",
		md: "sz-sm",
		lg: "sz-md",
	};
	return cn(
		"breadcrumb",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
