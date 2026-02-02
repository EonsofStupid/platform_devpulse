<!--
	@component PaginationContent
	@description Structural shell for pagination content container.
	Contract: kind="pagination", slot="content", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { PaginationContentProps } from "./types.js";

	let { children, class: className, ...rest }: PaginationContentProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PaginationContent");
</script>

<div
	{...rest}
	data-kind="pagination"
	data-slot="content"
	class={cn(className)}
>
	{@render children?.()}
</div>
