<!--
	@component CommandEmpty
	@description Structural shell for command empty state.
	Contract: kind="command", slot="empty", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CommandEmptyProps } from "./types.js";

	let { children, class: className, ...rest }: CommandEmptyProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CommandEmpty");
</script>

<div
	{...rest}
	data-kind="command"
	data-slot="empty"
	class={cn(className)}
>
	{@render children?.()}
</div>
