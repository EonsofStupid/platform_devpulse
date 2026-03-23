<!--
	@component ColorSwatchPicker.Item
	@kind color-swatch-picker
	@slot item
	@layer components

	Wraps a color value as a selectable option within the picker.
	role="option" with aria-selected. Keyboard enter/space to select.
	Renders a ColorSwatch internally.
-->
<script lang="ts">
import { ColorSwatch } from "$lib/design/components/color-swatch/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getColorSwatchPickerContext } from "./context.js";
import type { ColorValue } from "$lib/design/components/color-area/types.js";

let {
	color,
	colorName,
	class: className,
	...rest
}: {
	color: ColorValue;
	colorName?: string;
	class?: string;
} = $props();

const ctx = getColorSwatchPickerContext();
const selected = $derived(ctx.isSelected(color));

function handleClick() {
	ctx.select(color);
}

function handleKeyDown(e: KeyboardEvent) {
	if (e.key === "Enter" || e.key === " ") {
		e.preventDefault();
		ctx.select(color);
	}
}
</script>

<div
	role="option"
	aria-selected={selected}
	aria-disabled={ctx.isDisabled || undefined}
	tabindex={ctx.isDisabled ? -1 : 0}
	data-kind="color-swatch-picker"
	data-slot="item"
	data-selected={selected || undefined}
	class={cn(
		ctx.classes.item,
		selected ? ctx.classes.itemSelected : undefined,
		className)}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	{...rest}
>
	<ColorSwatch
		{color}
		{colorName}
		size={ctx.size}
		rounding={ctx.rounding}
	/>
</div>
