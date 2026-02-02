<!--
	@component BreadcrumbPage
	@description Structural shell for breadcrumb current page indicator.
	Contract: kind="breadcrumb", slot="page", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { BreadcrumbPageProps } from "./types.js";

	let { children, class: className, ...rest }: BreadcrumbPageProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "BreadcrumbPage");
</script>

<span
	{...rest}
	data-kind="breadcrumb"
	data-slot="page"
	class={cn(className)}
>
	{@render children?.()}
</span>
