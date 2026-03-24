<!--
	@component Select
	@kind select
	@layer component
	@category interactive
	@description Dropdown control for choosing a single value from a predefined list of options
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle select-default
	@styleIds select-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, typography, color
	@slots root:all, trigger:none, content:none, item:none, group:none, label:none
-->
<script lang="ts">
import { useSelect } from "$lib/design/primitives/select/use-select.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setSelectContext } from "./context.js";
import type { SelectProps } from "./types.js";

let {
	value,
	onValueChange,
	open,
	onOpenChange,
	placeholder,
	disabled = false,
	children,
	class: className,
	...rest
}: SelectProps = $props();

const hook = useSelect({
	get value() { return value; },
	get open() { return open; },
	get disabled() { return disabled; },
	onValueChange: (v) => onValueChange?.(v),
	onOpenChange: (v) => onOpenChange?.(v),
	placeholder,
});

const styleId = "select-default";

setSelectContext({
	get hook() { return hook; },
	get placeholder() { return placeholder; },
});
</script>

<StyleMacro kind="select" style={styleId}>
	<div
		{...hook.root}
		class={cn(disabled && "opacity-50 pointer-events-none", className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
