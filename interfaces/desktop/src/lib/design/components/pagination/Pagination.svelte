<!--
	@component Pagination
	@kind pagination
	@layer components

	ColdLight Pagination — ColdLight-owned page navigation component.
	No external builder — computes page ranges internally.
	Renders nav landmark with aria-label, aria-current for active page.
	Reference: WAI-ARIA APG Navigation Landmark
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import {
	paginationEllipsisRecipe,
	paginationNavRecipe,
	paginationPageRecipe,
	paginationRootRecipe,
} from "./recipe.js";
import type { PaginationComponentProps } from "./types.js";

let {
	// Kind-specific props
	page = 1,
	totalPages,
	onPageChange,
	siblings = 1,
	boundaries = 1,
	size = "md",
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	// Rest spread
	...rest
}: PaginationComponentProps = $props();

/**
 * Compute visible page range with ellipsis.
 * Returns array of page numbers and "ellipsis" markers.
 */
function getPageRange(
	current: number,
	total: number,
	sibs: number,
	bounds: number,
): (number | "ellipsis")[] {
	const totalNumbers = sibs * 2 + 1 + bounds * 2;
	if (totalNumbers >= total) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	const leftSibIdx = Math.max(current - sibs, bounds + 1);
	const rightSibIdx = Math.min(current + sibs, total - bounds);

	const showLeftEllipsis = leftSibIdx > bounds + 1;
	const showRightEllipsis = rightSibIdx < total - bounds;

	const result: (number | "ellipsis")[] = [];

	// Left boundary pages
	for (let i = 1; i <= bounds; i++) {
		result.push(i);
	}

	if (showLeftEllipsis) {
		result.push("ellipsis");
	}

	// Sibling pages
	for (let i = leftSibIdx; i <= rightSibIdx; i++) {
		result.push(i);
	}

	if (showRightEllipsis) {
		result.push("ellipsis");
	}

	// Right boundary pages
	for (let i = total - bounds + 1; i <= total; i++) {
		result.push(i);
	}

	return result;
}

const pages = $derived(getPageRange(page, totalPages, siblings, boundaries));
const isFirstPage = $derived(page <= 1);
const isLastPage = $derived(page >= totalPages);

// Resolve ColdLight visual
const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

// Compose: structural recipe + ColdLight visual + user classes
const rootClasses = $derived(cn(paginationRootRecipe(), visual.segments, visual.radius, className));
</script>

<nav
	{...rest}
	class={rootClasses}
	aria-label="Pagination"
	data-kind="pagination"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
>
	<button
		class={paginationNavRecipe({ size })}
		data-kind="pagination"
		data-slot="previous"
		disabled={isFirstPage}
		aria-label="Go to previous page"
		onclick={() => {
			if (!isFirstPage) onPageChange?.(page - 1);
		}}
	>
		&lsaquo;
	</button>

	{#each pages as item, idx}
		{#if item === "ellipsis"}
			<span
				class={paginationEllipsisRecipe({ size })}
				data-kind="pagination"
				data-slot="ellipsis"
				role="presentation"
			>
				&hellip;
			</span>
		{:else}
			{@const isActive = item === page}
			<button
				class={paginationPageRecipe({ size, active: isActive })}
				data-kind="pagination"
				data-slot="page"
				data-state={isActive ? "selected" : "idle"}
				aria-current={isActive ? "page" : undefined}
				aria-label={`Page ${item}`}
				onclick={() => onPageChange?.(item)}
			>
				{item}
			</button>
		{/if}
	{/each}

	<button
		class={paginationNavRecipe({ size })}
		data-kind="pagination"
		data-slot="next"
		disabled={isLastPage}
		aria-label="Go to next page"
		onclick={() => {
			if (!isLastPage) onPageChange?.(page + 1);
		}}
	>
		&rsaquo;
	</button>
</nav>
