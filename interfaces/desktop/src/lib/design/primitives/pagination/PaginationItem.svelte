<!--
	@component PaginationItem
	@description Structural shell for pagination page button.
	Contract: kind="pagination", slot="item", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { PaginationItemProps } from "./types.js";

let { children, class: className, ...rest }: PaginationItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PaginationItem");
</script>

<button
	{...rest}
	data-kind="pagination"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</button>
