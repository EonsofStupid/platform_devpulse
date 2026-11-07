<!--
	@component CardHeader
	@description Structural shell for card header.
	Contract: kind="card", slot="header", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { CardHeaderProps } from "./types.js";

let { children, class: className, ...rest }: CardHeaderProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CardHeader");
</script>

<div
	{...rest}
	data-kind="card"
	data-slot="header"
	class={cn(className)}
>
	{@render children?.()}
</div>
