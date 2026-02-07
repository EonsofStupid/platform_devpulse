<!--
	@component CommandItem
	@description Structural shell for command selectable item.
	Contract: kind="command", slot="item", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { CommandItemProps } from "./types.js";

let { children, class: className, ...rest }: CommandItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CommandItem");
</script>

<div
	{...rest}
	data-kind="command"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</div>
