/**
 * @file Pagination Recipe — Shortcode Composition
 * @kind pagination
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (pagination-*) handle layout/positioning.
 * Shortcode classes (sz-*) set --recipe-* vars consumed by structural CSS.
 * Active page buttons receive v-* s-* e-* for visual treatment.
 */

import { cn } from "$lib/design/utils/cn.js";

type PaginationRecipeProps = { size?: string; active?: boolean };

export function paginationRootRecipe(): string {
	return "pagination-root";
}

export function paginationPageRecipe(props: PaginationRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"pagination-page",
		`sz-${size}`,
		props.active ? "v-cyber s-glass e-1" : "",
	);
}

export function paginationNavRecipe(props: PaginationRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"pagination-nav",
		`sz-${size}`,
	);
}

export function paginationEllipsisRecipe(props: PaginationRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"pagination-ellipsis",
		`sz-${size}`,
	);
}
