<!--
	@component Toggle
	@description Structural shell for toggle primitive.
	Contract: kind="toggle", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setToggleContext } from "./context.js";
import type { ToggleProps } from "./types.js";

let { pressed = $bindable(false), children, class: className, ...rest }: ToggleProps = $props();

setToggleContext({
	get pressed() {
		return pressed;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Toggle");
</script>

<button
	{...rest}
	data-kind="toggle"
	data-slot="root"
	data-state={pressed ? "pressed" : undefined}
	class={cn(className)}
>
	{@render children?.()}
</button>
