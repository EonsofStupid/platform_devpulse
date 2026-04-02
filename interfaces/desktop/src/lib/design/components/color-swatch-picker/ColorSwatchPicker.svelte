<!--
	@component Color Swatch Picker
	@kind color-swatch-picker
	@layer component
	@category interactive
	@description Grid of selectable color swatches for choosing from a predefined palette
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle color-swatch-picker-default
	@styleIds color-swatch-picker-default
	@requiredAxes border, borderRadius
	@slots root:all, swatch:none
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
import { createIds } from "$lib/design/behaviors/_internal/utils/uid.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
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
	preset = "default",
	class: className,
	...rest
}: ColorSwatchPickerRootProps = $props();

const autoIds = createIds("color-swatch-picker", ["root"] as const);
const rootId = $derived(userIds?.root ?? autoIds.root);

let internalValue = $state<string | undefined>(undefined);

$effect(() => {
	if (controlledValue !== undefined) {
		internalValue = controlledValue;
	} else if (internalValue === undefined && defaultValue !== undefined) {
		internalValue = defaultValue;
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

const DENSITY_GAP: Record<string, string> = {
	compact: "gap-4",
	regular: "gap-8",
	spacious: "gap-12",
};

setColorSwatchPickerContext({
	get selectedValue() {
		return selectedValue;
	},
	get size() {
		return size;
	},
	get rounding() {
		return rounding;
	},
	get isDisabled() {
		return isDisabled;
	},
	select,
	isSelected,
});

const m = $derived(renderForge({ kind: "color-swatch-picker", preset }));
</script>

<div
	id={rootId}
	{dir}
	role="listbox"
	aria-label="Color swatches"
	aria-disabled={isDisabled || undefined}
	{...m.dataAttrs}
	data-slot="root"
	data-density={density}
	style={cssVarString(m.cssVars)}
	class={cn("flex flex-wrap", DENSITY_GAP[density] ?? DENSITY_GAP.regular, className)}
	{...rest}
>
	{@render children?.()}
</div>
