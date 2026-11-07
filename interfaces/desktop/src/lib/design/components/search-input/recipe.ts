/**
 * @file SearchInput Recipe — Structural Classes Only
 * @kind search-input
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type SearchInputRecipeProps = { size?: string };

const SIZE_MAP: Record<string, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-6 text-base",
};

export function searchInputRecipe(props: SearchInputRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn("search-input-root", SIZE_MAP[size] ?? SIZE_MAP.md, "rounded-md");
}

export function searchInputInputRecipe(): string {
	return "search-input-input";
}

export function searchInputIconRecipe(_props: SearchInputRecipeProps = {}): string {
	return cn("search-input-icon");
}

export function searchInputClearRecipe(_props: SearchInputRecipeProps = {}): string {
	return cn("search-input-clear");
}
