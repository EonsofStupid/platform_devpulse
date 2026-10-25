<!--
	@component CardTitle
	@description Structural shell for card title.
	Contract: kind="card", slot="title", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { CardTitleProps } from "./types.js";

let { children, class: className, ...rest }: CardTitleProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CardTitle");
</script>

<h3
	{...rest}
	data-kind="card"
	data-slot="title"
	class={cn(className)}
>
	{@render children?.()}
</h3>
