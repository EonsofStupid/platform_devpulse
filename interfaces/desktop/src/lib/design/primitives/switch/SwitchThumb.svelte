<!--
	@component SwitchThumb
	@description Structural shell for switch thumb indicator.
	Contract: kind="switch", slot="thumb", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SwitchThumbProps } from "./types.js";
	import { getSwitchContext } from "./context.js";

	let { children, class: className, ...rest }: SwitchThumbProps = $props();
	const ctx = getSwitchContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SwitchThumb");
</script>

<span
	{...rest}
	data-kind="switch"
	data-slot="thumb"
	data-state={ctx.checked ? "checked" : undefined}
	class={cn(className)}
>
	{@render children?.()}
</span>
