<!--
	@component ColorArea.Gradient
	@kind color-area
	@slot gradient
	@layer components

	The gradient background surface. Consumer can override with custom gradient CSS.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getColorAreaContext } from "./context.js";
import type { ColorAreaGradientProps } from "./types.js";

let { children, class: className, ...rest }: ColorAreaGradientProps = $props();
const ctx = getColorAreaContext();
</script>

<div
	data-kind="color-area"
	data-slot="gradient"
	class={cn(className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
