<!--
	@component VisuallyHidden
	@description Structural shell for visually-hidden utility.
	Contract: kind="visually-hidden", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { VisuallyHiddenProps } from "./types.js";

	let { children, class: className, ...rest }: VisuallyHiddenProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "VisuallyHidden");
</script>

<span
	{...rest}
	data-kind="visually-hidden"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</span>
