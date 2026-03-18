/**
 * @file Checkbox Recipe — Shortcode Class Composition
 * @kind interactive
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (checkbox, checkbox-{size}) handle layout/sizing/states
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type CheckboxRecipeProps = { intent?: string; size?: string };

export function checkboxRecipe(props: CheckboxRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "checkbox-sm",
		md: "checkbox-md",
		lg: "checkbox-lg",
	};
	return cn("checkbox", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}
