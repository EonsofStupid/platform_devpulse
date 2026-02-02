<!--
	@component CommandSeparator
	@description Structural shell for command separator.
	Contract: kind="command", slot="separator", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CommandSeparatorProps } from "./types.js";

	let { children, class: className, ...rest }: CommandSeparatorProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CommandSeparator");
</script>

<div
	{...rest}
	data-kind="command"
	data-slot="separator"
	class={cn(className)}
>
	{@render children?.()}
</div>
