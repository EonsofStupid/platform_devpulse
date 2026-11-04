<!--
	@component BreadcrumbsSeparator
	@kind breadcrumbs
	@slot separator
	@layer components

	The presentational mark between steps, hidden from screen readers.
-->
<script lang="ts">
import { getBreadcrumbsContext } from "./context.js";
import type { BreadcrumbsSeparatorProps } from "./types.js";

let { children, ...rest }: BreadcrumbsSeparatorProps = $props();

const ctx = getBreadcrumbsContext();
</script>

<span {...ctx.hook.separator} {...rest}>
	{#if children}
		{@render children()}
	{:else}
		{ctx.separator}
	{/if}
</span>
