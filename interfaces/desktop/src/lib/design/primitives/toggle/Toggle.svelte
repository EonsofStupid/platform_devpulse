<!--
	@component Toggle
	@description Structural shell for toggle primitive.
	Contract: kind="toggle", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ToggleProps } from "./types.js";

	let { children, class: className, ...rest }: ToggleProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Toggle");
</script>

<button
	{...rest}
	data-kind="toggle"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</button>
