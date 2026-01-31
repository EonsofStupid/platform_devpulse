<!--
	@component SelectTrigger
	@description Structural trigger button for select.
	Contract: kind="select", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SelectTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: SelectTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectTrigger");
</script>

<button
	{...rest}
	data-kind="select"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
