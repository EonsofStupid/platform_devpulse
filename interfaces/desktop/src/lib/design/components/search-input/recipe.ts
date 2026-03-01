/**
 * @file SearchInput Recipe — Shortcode Composition
 * @kind search-input
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (search-input-*) handle layout/positioning.
 * Root receives v-* s-* e-* for glass surface treatment.
 * Size via sz-* sets --recipe-font-size, --recipe-icon-size, --recipe-padding-*.
 */

import { cn } from "$lib/design/utils/cn.js";

type SearchInputRecipeProps = { size?: string };

export function searchInputRecipe(props: SearchInputRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"search-input-root",
		"v-s1",
		`sz-${size}`,
		"rounded-md",
	);
}

export function searchInputInputRecipe(): string {
	return "search-input-input";
}

export function searchInputIconRecipe(props: SearchInputRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"search-input-icon",
		`sz-${size}`,
	);
}

export function searchInputClearRecipe(props: SearchInputRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"search-input-clear",
		`sz-${size}`,
	);
}
