<!--
	@component CardContent
	@description Structural shell for card content area.
	Contract: kind="card", slot="content", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CardContentProps } from "./types.js";

	let { children, class: className, ...rest }: CardContentProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CardContent");
</script>

<div
	{...rest}
	data-kind="card"
	data-slot="content"
	class={cn(className)}
>
	{@render children?.()}
</div>
