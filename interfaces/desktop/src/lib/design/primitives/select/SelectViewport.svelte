<!--
	@component SelectViewport
	@description Structural scrollable viewport for select content.
	Contract: kind="select", slot="viewport"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SelectViewportProps } from "./types.js";

	let { children, class: className, ...rest }: SelectViewportProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectViewport");
</script>

<div
	{...rest}
	data-kind="select"
	data-slot="viewport"
	class={cn(className)}
>
	{@render children?.()}
</div>
