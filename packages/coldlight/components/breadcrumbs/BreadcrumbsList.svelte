<!--
	@component BreadcrumbsList
	@kind breadcrumbs
	@slot list
	@layer components

	The ordered list of the trail.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getBreadcrumbsContext } from "./context.js";
import type { BreadcrumbsListProps } from "./types.js";

let { children, class: className, ...rest }: BreadcrumbsListProps = $props();

const ctx = getBreadcrumbsContext();
</script>

<ol {...ctx.hook.list} class={cn("flex flex-wrap items-center gap-2", className)} {...rest}>
	{@render children?.()}
</ol>
