<!--
	@component TabsList
	@description Structural container for tab triggers.
	Contract: kind="tabs", slot="list"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { TabsListProps } from "./types.js";

	let { children, class: className, ...rest }: TabsListProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TabsList");
</script>

<div
	{...rest}
	data-kind="tabs"
	data-slot="list"
	class={cn(className)}
>
	{@render children?.()}
</div>
