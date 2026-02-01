<!--
	@component CardFooter
	@description Structural shell for card footer.
	Contract: kind="card", slot="footer", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CardFooterProps } from "./types.js";

	let { children, class: className, ...rest }: CardFooterProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CardFooter");
</script>

<div
	{...rest}
	data-kind="card"
	data-slot="footer"
	class={cn(className)}
>
	{@render children?.()}
</div>
