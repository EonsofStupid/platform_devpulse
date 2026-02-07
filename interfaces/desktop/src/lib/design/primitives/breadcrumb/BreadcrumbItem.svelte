<!--
	@component BreadcrumbItem
	@description Structural shell for breadcrumb item.
	Contract: kind="breadcrumb", slot="item", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { BreadcrumbItemProps } from "./types.js";

let { children, class: className, ...rest }: BreadcrumbItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "BreadcrumbItem");
</script>

<li
	{...rest}
	data-kind="breadcrumb"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</li>
