/**
 * @file Checkbox Composition — Shortcode Class Composition
 * @kind interactive
 * @layer components
 *
 * GOLD STANDARD composition — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (checkbox, checkbox-{size}) handle layout/sizing/states
 *   - NO raw Tailwind utilities in composition output
 */

import { cn } from "$lib/design/utils/cn.js";

type CheckboxRecipeProps = { intent?: string; size?: string };

export function checkboxComposition(props: CheckboxRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "checkbox-sm",
		md: "checkbox-md",
		lg: "checkbox-lg",
	};
	return cn("checkbox", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}
