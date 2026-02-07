<!--
	@component ToggleGroupItem
	@description Structural shell for toggle-group item.
	Contract: kind="toggle-group", slot="item", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getToggleGroupContext } from "./context.js";
import type { ToggleGroupItemProps } from "./types.js";

let { value, children, class: className, ...rest }: ToggleGroupItemProps = $props();
const ctx = getToggleGroupContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ToggleGroupItem");
</script>

<button
	{...rest}
	data-kind="toggle-group"
	data-slot="item"
	data-state={ctx.value.includes(value) ? "pressed" : undefined}
	class={cn(className)}
>
	{@render children?.()}
</button>
