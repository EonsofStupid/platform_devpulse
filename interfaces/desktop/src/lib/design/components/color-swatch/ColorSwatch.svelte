<!--
	@component ColorSwatch
	@kind color-swatch
	@layer components

	Presentational colored square. Single element, no compound.
	role="img" with accessible color name.
	Checkerboard background for alpha transparency visibility.
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
