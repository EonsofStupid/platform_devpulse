<!--
	@component ToggleGroup
	@description Structural shell for toggle-group primitive.
	Contract: kind="toggle-group", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setToggleGroupContext } from "./context.js";
import type { ToggleGroupProps } from "./types.js";

let { value = $bindable([]), children, class: className, ...rest }: ToggleGroupProps = $props();

setToggleGroupContext({
	get value() {
		return value;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ToggleGroup");
</script>

<div
	{...rest}
	data-kind="toggle-group"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
