<!--
	@component AspectRatio
	@description Structural shell for aspect-ratio utility.
	Utility: no taxonomy contract. CSS aspect-ratio wrapper.
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { AspectRatioProps } from "./types.js";

let { children, class: className, ...rest }: AspectRatioProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AspectRatio");
</script>

<div
	{...rest}
	data-kind="aspect-ratio"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
