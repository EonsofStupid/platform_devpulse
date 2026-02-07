<!--
	@component Switch
	@description Structural shell for switch primitive.
	Contract: kind="switch", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setSwitchContext } from "./context.js";
import type { SwitchProps } from "./types.js";

let { checked = $bindable(false), children, class: className, ...rest }: SwitchProps = $props();

setSwitchContext({
	get checked() {
		return checked;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Switch");
</script>

<button
	{...rest}
	data-kind="switch"
	data-slot="root"
	data-state={checked ? "checked" : undefined}
	class={cn(className)}
>
	{@render children?.()}
</button>
