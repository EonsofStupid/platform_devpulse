/**
 * @file List Composition — Structural Classes Only
 * @kind list
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ListRecipeProps = { size?: string; variant?: string; spacing?: string };

export function listComposition(props: ListRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	const spacingMap: Record<string, string> = {
		compact: "list-spacing-compact",
		default: "list-spacing-default",
		relaxed: "list-spacing-relaxed",
	};
	return cn(
		"list-root",
		sizeMap[props.size ?? "md"] ?? "p-4 text-sm",
		spacingMap[props.spacing ?? "default"] ?? "list-spacing-default",
	);
}
