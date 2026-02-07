<!--
	@component PaginationEllipsis
	@description Structural shell for pagination ellipsis indicator.
	Contract: kind="pagination", slot="ellipsis", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { PaginationEllipsisProps } from "./types.js";

let { children, class: className, ...rest }: PaginationEllipsisProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PaginationEllipsis");
</script>

<span
	{...rest}
	data-kind="pagination"
	data-slot="ellipsis"
	class={cn(className)}
>
	{@render children?.()}
</span>
