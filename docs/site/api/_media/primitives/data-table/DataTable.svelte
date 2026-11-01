<script lang="ts">
	import type { DataTableProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: DataTableProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "DataTable");
</script>

<div data-kind="data-table" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
