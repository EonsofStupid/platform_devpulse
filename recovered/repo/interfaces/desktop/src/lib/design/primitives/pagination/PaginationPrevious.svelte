<!--
	@component PaginationPrevious
	@description Structural shell for pagination previous button.
	Contract: kind="pagination", slot="previous", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { PaginationPreviousProps } from "./types.js";

let { children, class: className, ...rest }: PaginationPreviousProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PaginationPrevious");
</script>

<button
	{...rest}
	data-kind="pagination"
	data-slot="previous"
	class={cn(className)}
>
	{@render children?.()}
</button>
