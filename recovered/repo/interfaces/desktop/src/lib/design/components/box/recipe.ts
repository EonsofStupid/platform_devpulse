/**
 * @file Box Recipe — Shortcode Class Composition
 * @kind layout
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (box-*) handle padding
 *   - rounded-* for radius (allowed per gold standard)
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type BoxRecipeProps = { padding?: string; radius?: string };

export function boxRecipe(props: BoxRecipeProps = {}): string {
	const paddingMap: Record<string, string> = {
		none: "box-none",
		sm: "box-sm",
		md: "box-md",
		lg: "box-lg",
	};
	const radiusMap: Record<string, string> = {
		none: "rounded-none",
		sm: "rounded-sm",
		md: "rounded-md",
		lg: "rounded-lg",
	};
	return cn(
		paddingMap[props.padding ?? "md"] ?? paddingMap.md,
		radiusMap[props.radius ?? "none"] ?? radiusMap.none,
	);
}
