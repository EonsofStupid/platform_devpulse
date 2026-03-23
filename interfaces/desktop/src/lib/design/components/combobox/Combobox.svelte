<!--
	@component Combobox (Root)
	@kind combobox
	@layer components

	ColdLight Combobox — compound component root.
	Uses useComboBox() primitive hook for all ARIA and behavior.
	Sets context for sub-components.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
import { useComboBox } from "$lib/design/primitives/combobox/use-combobox.svelte.js";
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
	children,
	class: className,
	...rest
}: ComboboxProps = $props();

const hook = useComboBox({
	get inputValue() { return inputValue; },
	onInputChange: (v) => onInputValueChange?.(v),
	get selectedValue() { return value as string | undefined; },
	onSelectedChange: (v) => onValueChange?.(v),
	get open() { return open; },
	onOpenChange: (v) => onOpenChange?.(v),
	get disabled() { return disabled; },
});

	recipeDef?.classes?.({
		...recipeDef.defaults,
		size,
	} as DsSurfaceProps) ?? {});

setComboboxContext({
	get hook() { return hook; },
	get disabled() { return disabled; },
	get size() { return size; },
	dir: "ltr",
});

const rootClasses = $derived(
	cn(disabled && "opacity-50 pointer-events-none", className));
</script>

<div
	{...hook.root}
	aria-disabled={disabled ? "true" : undefined}
	class={rootClasses}
	{...rest}
>
	{@render children?.()}
</div>
