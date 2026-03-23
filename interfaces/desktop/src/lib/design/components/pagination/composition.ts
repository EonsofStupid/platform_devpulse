/**
 * @file Pagination Composition — Structural Classes Only
 * @kind pagination
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type PaginationRecipeProps = { size?: string; active?: boolean };

const SIZE_MAP: Record<string, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-6 text-base",
};

export function paginationRootComposition(): string {
	return "pagination-root";
}

export function paginationPageComposition(props: PaginationRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn("pagination-page", SIZE_MAP[size] ?? SIZE_MAP.md);
}

export function paginationNavComposition(props: PaginationRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn("pagination-nav", SIZE_MAP[size] ?? SIZE_MAP.md);
}

export function paginationEllipsisComposition(props: PaginationRecipeProps = {}): string {
	const size = props.size ?? "md";
	const labelSize: Record<string, string> = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};
	return cn("pagination-ellipsis", labelSize[size] ?? labelSize.md);
}
