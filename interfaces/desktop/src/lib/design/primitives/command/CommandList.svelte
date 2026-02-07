<!--
	@component CommandList
	@description Structural shell for command results list.
	Contract: kind="command", slot="list", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { CommandListProps } from "./types.js";

let { children, class: className, ...rest }: CommandListProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CommandList");
</script>

<div
	{...rest}
	data-kind="command"
	data-slot="list"
	class={cn(className)}
>
	{@render children?.()}
</div>
