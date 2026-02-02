<!--
	@component BreadcrumbList
	@description Structural shell for breadcrumb ordered list.
	Contract: kind="breadcrumb", slot="list", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { BreadcrumbListProps } from "./types.js";

	let { children, class: className, ...rest }: BreadcrumbListProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "BreadcrumbList");
</script>

<ol
	{...rest}
	data-kind="breadcrumb"
	data-slot="list"
	class={cn(className)}
>
	{@render children?.()}
</ol>
