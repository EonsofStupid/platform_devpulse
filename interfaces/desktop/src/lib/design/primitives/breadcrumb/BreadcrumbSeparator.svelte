<!--
	@component BreadcrumbSeparator
	@description Structural shell for breadcrumb visual separator.
	Contract: kind="breadcrumb", slot="separator", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { BreadcrumbSeparatorProps } from "./types.js";

	let { children, class: className, ...rest }: BreadcrumbSeparatorProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "BreadcrumbSeparator");
</script>

<span
	{...rest}
	data-kind="breadcrumb"
	data-slot="separator"
	class={cn(className)}
>
	{@render children?.()}
</span>
