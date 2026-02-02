<!--
	@component PaginationNext
	@description Structural shell for pagination next button.
	Contract: kind="pagination", slot="next", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { PaginationNextProps } from "./types.js";

	let { children, class: className, ...rest }: PaginationNextProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PaginationNext");
</script>

<button
	{...rest}
	data-kind="pagination"
	data-slot="next"
	class={cn(className)}
>
	{@render children?.()}
</button>
