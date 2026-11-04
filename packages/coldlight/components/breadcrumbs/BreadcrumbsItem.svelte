<!--
	@component BreadcrumbsItem
	@kind breadcrumbs
	@slot item
	@layer components

	One step of the trail.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getBreadcrumbsContext } from "./context.js";
import type { BreadcrumbsItemProps } from "./types.js";

let { children, class: className, ...rest }: BreadcrumbsItemProps = $props();

const ctx = getBreadcrumbsContext();
</script>

<li {...ctx.hook.item} class={cn("inline-flex items-center gap-2", className)} {...rest}>
	{@render children?.()}
</li>
