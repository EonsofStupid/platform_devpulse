/**
 * @file DataTable Composition — Structural Classes Only
 * @kind visual
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DataTableRecipeProps = { size?: string; variant?: string };

export function dataTableComposition(props: DataTableRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	return cn("data-table-root", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}
