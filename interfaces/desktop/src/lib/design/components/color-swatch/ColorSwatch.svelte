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
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
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
	intent = "default",
	class: className,
	...rest
}: ColorSwatchProps = $props();

const accessibleName = $derived(colorName ?? color);
</script>

<StyleMacro kind="color-swatch" intent={intent}>
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
