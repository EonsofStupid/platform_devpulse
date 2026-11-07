<!--
	@component Pagination
	@description Structural shell for pagination primitive.
	Contract: kind="pagination", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setPaginationContext } from "./context.js";
import type { PaginationProps } from "./types.js";

let { page = $bindable(1), children, class: className, ...rest }: PaginationProps = $props();

setPaginationContext({
	get page() {
		return page;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Pagination");
</script>

<nav
	{...rest}
	data-kind="pagination"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</nav>
