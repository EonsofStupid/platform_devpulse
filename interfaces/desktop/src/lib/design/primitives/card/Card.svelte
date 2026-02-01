<!--
	@component Card
	@description Structural shell for card primitive (root container).
	Contract: kind="card", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CardProps } from "./types.js";

	let { children, class: className, ...rest }: CardProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Card");
</script>

<div
	{...rest}
	data-kind="card"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
