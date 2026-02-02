<!--
	@component CommandGroup
	@description Structural shell for command item group.
	Contract: kind="command", slot="group", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CommandGroupProps } from "./types.js";

	let { children, class: className, ...rest }: CommandGroupProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CommandGroup");
</script>

<div
	{...rest}
	data-kind="command"
	data-slot="group"
	class={cn(className)}
>
	{@render children?.()}
</div>
