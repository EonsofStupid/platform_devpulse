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
import { useSelect } from "$lib/design/behaviors/select/use-select.svelte.js";
import { selectAnatomy } from "$lib/design/primitives/select/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
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
	preset = "default",
	children,
	class: className,
	...rest
}: SelectProps = $props();

const hook = useSelect({
	get value() {
		return value;
	},
	get open() {
		return open;
	},
	get disabled() {
		return disabled;
	},
	onValueChange: (v) => onValueChange?.(v),
	onOpenChange: (v) => onOpenChange?.(v),
	get placeholder() {
		return placeholder;
	},
});

setSelectContext({
	get hook() {
		return hook;
	},
	get placeholder() {
		return placeholder;
	},
});

const m = $derived(resolveMacro({ kind: "select", preset }));
</script>

<div
		{...selectAnatomy.attrs.root}
		{...hook.root}
		{...rest}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		class={cn(disabled && "opacity-50 pointer-events-none", className)}
	>
		{@render children?.()}
	</div>
