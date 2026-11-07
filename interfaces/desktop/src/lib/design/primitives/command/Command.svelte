<!--
	@component Command
	@description Structural shell for command primitive.
	Contract: kind="command", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setCommandContext } from "./context.js";
import type { CommandProps } from "./types.js";

let { value = $bindable(""), children, class: className, ...rest }: CommandProps = $props();

setCommandContext({
	get value() {
		return value;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Command");
</script>

<div
	{...rest}
	data-kind="command"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
