<!--
	@component Button
	@description Structural shell for button primitive.
	Contract: kind="button", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ButtonProps } from "./types.js";

	let {
		disabled = false,
		children,
		class: className,
		...rest
	}: ButtonProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Button");
</script>

<button
	{...rest}
	data-kind="button"
	data-slot="root"
	class={cn(className)}
	disabled={disabled || undefined}
>
	{@render children?.()}
</button>
