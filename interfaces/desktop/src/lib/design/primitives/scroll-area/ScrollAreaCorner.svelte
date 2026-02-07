<!--
	@component ScrollAreaCorner
	@description Structural corner element for scroll area.
	Contract: kind="scroll-area", slot="corner"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ScrollAreaCornerProps } from "./types.js";

let { children, class: className, ...rest }: ScrollAreaCornerProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ScrollAreaCorner");
</script>

<div
	{...rest}
	data-kind="scroll-area"
	data-slot="corner"
	class={cn(className)}
>
	{@render children?.()}
</div>
