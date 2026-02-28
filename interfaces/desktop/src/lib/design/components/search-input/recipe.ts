/**
 * @file SearchInput Recipe
 * @kind search-input
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type SearchInputRecipeProps = { size?: string };

export function searchInputRecipe(props: SearchInputRecipeProps = {}): string {
	return cn("relative inline-flex items-center w-full rounded-md", "v-void s-glass e-0");
}

export function searchInputInputRecipe(): string {
	return cn(
		"flex-1 bg-transparent border-0 outline-none px-3 py-2",
		"text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
		"text-sm",
	);
}

export function searchInputIconRecipe(props: SearchInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "h-3.5 w-3.5",
		md: "h-4 w-4",
		lg: "h-5 w-5",
	};
	return cn("absolute left-3 text-[var(--text-muted)]", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}

export function searchInputClearRecipe(props: SearchInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};
	return cn(
		"absolute right-2 inline-flex items-center justify-center rounded-sm",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
		"text-[var(--text-muted)] hover:text-[var(--text-primary)]",
		"transition-colors",
	);
}
