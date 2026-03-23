<!--
	@component ColorSwatch
	@kind color-swatch
	@layer components

	Presentational colored square. Single element, no compound.
	role="img" with accessible color name.
	Checkerboard background for alpha transparency visibility.
-->
<script lang="ts">
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

const recipeClasses = $derived(
		recipe?.classes?.({ size, rounding } as any) ?? {});

const rootClasses = $derived(
	cn(className));
</script>

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
	class={rootClasses}
	style:background-color={color}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
