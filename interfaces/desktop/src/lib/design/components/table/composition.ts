/**
 * @file Table Composition — Structural Classes Only
 * @kind table
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type TableRecipeProps = { size?: string; variant?: string };

export function tableComposition(props: TableRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	return cn("table-root", sizeMap[props.size ?? "md"] ?? "p-4 text-sm");
}
