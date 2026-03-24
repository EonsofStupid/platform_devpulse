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
-->
<script lang="ts">
import { useComboBox } from "$lib/design/primitives/combobox/use-combobox.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
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

const styleId = "combobox-default";

setComboboxContext({
	get hook() { return hook; },
	get disabled() { return disabled; },
	get size() { return size; },
	dir: "ltr",
});

</script>

<StyleMacro kind="combobox" style={styleId}>
	<div
		{...hook.root}
		data-kind="combobox"
		data-slot="root"
		aria-disabled={disabled ? "true" : undefined}
		class={cn(disabled && "opacity-50 pointer-events-none", className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
