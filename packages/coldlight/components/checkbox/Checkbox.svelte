<!--
	@component Checkbox
	@kind checkbox
	@layer component
	@category interactive
	@description Binary or tri-state toggle control for selecting options in a form
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle checkbox-default
	@styleIds checkbox-default
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, indicator:none, label:none
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
import { checkboxAnatomy } from "#coldlight/behaviors/inputs/checkbox/index.js";
import { useCheckbox } from "#coldlight/behaviors/inputs/checkbox/use-checkbox.svelte.js";
import { cssVarString, renderForge } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import type { CheckboxProps, CheckboxSize } from "./types.js";

const SIZE: Record<CheckboxSize, string> = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
};

let {
	preset = "default",
	size = "md",
	checked,
	defaultChecked,
	indeterminate,
	defaultIndeterminate,
	disabled = false,
	onCheckedChange,
	onIndeterminateChange,
	children,
	class: className,
	...rest
}: CheckboxProps = $props();

// Controlled when `checked` / `indeterminate` are given, otherwise the checkbox holds them.
const checkbox = useCheckbox({
	get checked() {
		return checked;
	},
	get defaultChecked() {
		return defaultChecked;
	},
	get indeterminate() {
		return indeterminate;
	},
	get defaultIndeterminate() {
		return defaultIndeterminate;
	},
	get disabled() {
		return disabled;
	},
	onCheckedChange: (v) => onCheckedChange?.(v),
	onIndeterminateChange: (v) => onIndeterminateChange?.(v),
});

const m = $derived(renderForge({ kind: "checkbox", preset }));
</script>

<button
	{...checkboxAnatomy.attrs.root}
	{...checkbox.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn(
		"inline-flex items-center justify-center rounded border cursor-pointer",
		"focus-visible:outline-2 focus-visible:outline-offset-2",
		"disabled:pointer-events-none disabled:opacity-50",
		SIZE[size] ?? SIZE.md,
		className)}
>
	<span {...checkboxAnatomy.attrs.indicator} {...checkbox.indicator}>
		{@render children?.()}
	</span>
</button>
