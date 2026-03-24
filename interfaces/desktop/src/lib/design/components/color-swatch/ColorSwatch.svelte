<!--
	@component Color Swatch
	@kind color-swatch
	@layer component
	@category interactive
	@description Small preview rectangle displaying a single color value
	@container false
	@compound false
	@blockCategory form
	@defaultStyle color-swatch-default
	@styleIds color-swatch-default
	@requiredAxes border, borderRadius
	@slots root:all
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ColorSwatchProps } from "./types.js";

let {
	id,
	color,
	colorName,
	size = "md",
	rounding = "default",
	dir = "ltr",
	children,
	class: className,
	...rest
}: ColorSwatchProps = $props();

const accessibleName = $derived(colorName ?? color);
const styleId = "color-swatch-default";
</script>

<StyleMacro kind="color-swatch" style={styleId}>
	<div
		{id}
		{dir}
		role="img"
		aria-roledescription="color swatch"
		aria-label={accessibleName}
		data-kind="color-swatch"
		data-slot="root"
		data-size={size}
		data-rounding={rounding}
		class={cn(className)}
		style:background-color={color}
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
</StyleMacro>
