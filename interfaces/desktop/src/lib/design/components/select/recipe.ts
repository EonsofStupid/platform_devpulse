/**
 * @file Select Recipe
 * @kind select
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

export function selectRecipe() {
	return {
		trigger: cn(
			"flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-sm",
			"v-void s-glass e-0",
			"text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
			"focus-visible:outline-none focus-visible:ring-2",
			"disabled:cursor-not-allowed disabled:opacity-50",
		),
		content: cn(
			"overflow-hidden rounded-md",
			"v-void s-glass e-3",
		),
		item: cn(
			"relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2",
			"text-sm text-[var(--text-primary)]",
			"hover:bg-[oklch(1_0_0/0.06)]",
			"data-[highlighted]:bg-[oklch(1_0_0/0.06)]",
			"transition-colors",
		),
		group: "p-1",
		label: "px-2 py-1.5 text-sm font-semibold text-[var(--text-primary)]",
	};
}
