<!--
	@component Combobox
	@kind combobox
	@layer component
	@category interactive
	@description Text input combined with a filterable dropdown list for selecting or entering a value
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle combobox-default
	@styleIds combobox-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, typography, color
	@slots root:all, input:none, trigger:none, listbox:none, option:none, label:none
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
import { useComboBox } from "$lib/design/behaviors/combobox/use-combobox.svelte.js";
import { comboboxAnatomy } from "$lib/design/primitives/combobox/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setComboboxContext } from "./context.js";
import type { ComboboxProps } from "./types.js";

let {
	value,
	onValueChange,
	inputValue,
	onInputValueChange,
	open,
	onOpenChange,
	size = "md",
	disabled = false,
	preset = "default",
	children,
	class: className,
	...rest
}: ComboboxProps = $props();

const hook = useComboBox({
	get inputValue() {
		return inputValue;
	},
	onInputChange: (v) => onInputValueChange?.(v),
	get selectedValue() {
		return value as string | undefined;
	},
	onSelectedChange: (v) => onValueChange?.(v),
	get open() {
		return open;
	},
	onOpenChange: (v) => onOpenChange?.(v),
	get disabled() {
		return disabled;
	},
});

setComboboxContext({
	get hook() {
		return hook;
	},
	get disabled() {
		return disabled;
	},
	get size() {
		return size;
	},
	dir: "ltr",
});

const m = $derived(renderForge({ kind: "combobox", preset }));
</script>

<div
	{...comboboxAnatomy.attrs.root}
	{...hook.root}
	{...rest}
	{...m.dataAttrs}
	aria-disabled={disabled ? "true" : undefined}
	style={cssVarString(m.cssVars)}
	class={cn(disabled && "opacity-50 pointer-events-none", className)}
>
	{@render children?.()}
</div>
