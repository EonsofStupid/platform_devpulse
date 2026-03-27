<!--
	@component Pagination
	@kind pagination
	@layer component
	@category navigation
	@description Page navigation controls for browsing through paginated data sets
	@container false
	@compound true
	@blockCategory navigation
	@defaultStyle pagination-default
	@styleIds pagination-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, prev:none, next:none, page:none, ellipsis:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { usePagination } from "$lib/design/behaviors/pagination/index.js";
import { resolveMacro, cssVarString } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { PaginationComponentProps } from "./types.js";
let { page = 1, totalPages, onPageChange, siblings = 1, boundaries = 1, size = "md", preset = "default", children, class: className, ...rest }: PaginationComponentProps = $props();
const m = $derived(resolveMacro({ kind: "pagination", preset }));
const pagination = usePagination();
function getPageRange(current: number, total: number, sibs: number, bounds: number): (number | string)[] {
	const totalNumbers = sibs * 2 + 1 + bounds * 2;
	if (totalNumbers >= total) return Array.from({ length: total }, (_, i) => i + 1);
	const leftSibIdx = Math.max(current - sibs, bounds + 1);
	const rightSibIdx = Math.min(current + sibs, total - bounds);
	const result = [];
	for (let i = 1; i <= bounds; i++) result.push(i);
	if (leftSibIdx > bounds + 1) result.push("ellipsis");
	for (let i = leftSibIdx; i <= rightSibIdx; i++) result.push(i);
	if (rightSibIdx < total - bounds) result.push("ellipsis");
	for (let i = total - bounds + 1; i <= total; i++) result.push(i);
	return result;
}
const pages = $derived(getPageRange(page, totalPages, siblings, boundaries));
const isFirstPage = $derived(page <= 1);
const isLastPage = $derived(page >= totalPages);
</script>
<nav {...pagination.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} data-slot="root" class={cn("flex items-center gap-1", className)} {...rest}>
		<button data-kind="pagination" data-slot="previous" disabled={isFirstPage} aria-label="Previous page" class="inline-flex items-center justify-center size-9 rounded-md cursor-pointer disabled:opacity-50 disabled:pointer-events-none" onclick={() => { if (!isFirstPage) onPageChange?.(page - 1); }}>&lsaquo;</button>
		{#each pages as item}
			{#if item === "ellipsis"}
				<span data-kind="pagination" data-slot="ellipsis" role="presentation" class="inline-flex items-center justify-center size-9">&hellip;</span>
			{:else}
				{@const isActive = item === page}
				<button data-kind="pagination" data-slot="page" data-state={isActive ? "selected" : "idle"} aria-current={isActive ? "page" : undefined} aria-label={"Page " + item} class="inline-flex items-center justify-center size-9 rounded-md text-sm cursor-pointer" onclick={() => onPageChange?.(item as number)}>{item}</button>
			{/if}
		{/each}
		<button data-kind="pagination" data-slot="next" disabled={isLastPage} aria-label="Next page" class="inline-flex items-center justify-center size-9 rounded-md cursor-pointer disabled:opacity-50 disabled:pointer-events-none" onclick={() => { if (!isLastPage) onPageChange?.(page + 1); }}>&rsaquo;</button>
	</nav>
