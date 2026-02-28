<script lang="ts">
	import type { TableProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: TableProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Table"); });
</script>

<table data-kind="table" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</table>
