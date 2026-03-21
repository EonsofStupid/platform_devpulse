<!--
	@component ColorSwatchPicker
	@kind color-swatch-picker
	@layer components

	Selectable grid of color swatches.
	role="listbox" — each swatch child should be wrapped as role="option".
	Keyboard arrow navigation for swatch selection.
-->
<script lang="ts">
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { setColorSwatchPickerContext } from "./context.js";
import type { ColorSwatchPickerRootProps } from "./types.js";

let {
	ids: userIds,
	value: controlledValue,
	defaultValue,
	onChange,
	size = "md",
	rounding = "none",
	density = "regular",
	isDisabled = false,
	dir = "ltr",
	children,
	class: className,
	...rest
}: ColorSwatchPickerRootProps = $props();

const autoIds = createIds("color-swatch-picker", ["root"] as const);
const rootId = userIds?.root ?? autoIds.root;

let internalValue = $state(defaultValue);

$effect(() => {
	if (controlledValue !== undefined) {
		internalValue = controlledValue;
	}
});

const selectedValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

function select(color: string) {
	if (isDisabled) return;
	internalValue = color;
	onChange?.({ value: color });
}

function isSelected(color: string): boolean {
	return selectedValue === color;
}

const recipe = getRecipe("color-swatch-picker.glass.void");
const recipeClasses = $derived(
	// biome-ignore lint/suspicious/noExplicitAny: recipe boundary
	recipe?.classes?.({ density } as any) ?? {},
);

const DENSITY_GAP: Record<string, string> = {
	compact: "gap-4",
	regular: "gap-8",
	spacious: "gap-12",
};

setColorSwatchPickerContext({
	get selectedValue() { return selectedValue; },
	get size() { return size; },
	get rounding() { return rounding; },
	get isDisabled() { return isDisabled; },
	get classes() { return recipeClasses; },
	select,
	isSelected,
});
</script>

<div
	id={rootId}
	{dir}
	role="listbox"
	aria-label="Color swatches"
	aria-disabled={isDisabled || undefined}
	data-kind="color-swatch-picker"
	data-slot="root"
	data-density={density}
	class={cn(recipeClasses.root, "flex flex-wrap", DENSITY_GAP[density] ?? DENSITY_GAP.regular, className)}
	{...rest}
>
	{@render children?.()}
</div>
