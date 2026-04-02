<!--
	@component Radio Group
	@kind radio-group
	@layer component
	@category interactive
	@description Mutually exclusive option set where only one item can be selected at a time
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/radio/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle radio-group-default
	@styleIds radio-group-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, item:none, indicator:none, label:none
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
import { useRadioGroup } from "$lib/design/behaviors/radio-group/use-radio-group.svelte.js";
import { radioGroupAnatomy } from "$lib/design/primitives/radio-group/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setRadioGroupContext } from "./context.js";
import type { RadioGroupProps } from "./types.js";

let {
	value,
	onValueChange,
	disabled = false,
	required = false,
	loop = true,
	orientation = "vertical",
	preset = "default",
	children,
	class: className,
	...rest
}: RadioGroupProps = $props();

const hook = useRadioGroup({
	get value() {
		return value;
	},
	get disabled() {
		return disabled;
	},
	get required() {
		return required;
	},
	get orientation() {
		return orientation;
	},
	get loop() {
		return loop;
	},
	onValueChange: (v) => onValueChange?.(v),
});

setRadioGroupContext({
	get hook() {
		return hook;
	},
});

const m = $derived(renderForge({ kind: "radio-group", preset }));
</script>

<div
		{...radioGroupAnatomy.attrs.root}
		{...hook.root}
		{...rest}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		data-orientation={orientation}
		class={cn(
			"flex gap-2",
			orientation === "horizontal" ? "flex-row" : "flex-col",
			className)}
	>
		{@render children?.()}
	</div>
