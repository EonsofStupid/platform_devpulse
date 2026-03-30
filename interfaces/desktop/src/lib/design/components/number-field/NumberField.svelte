<!--
	@component Number Field
	@kind number-field
	@layer component
	@category interactive
	@description Numeric input with increment/decrement stepper buttons
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle number-field-default
	@styleIds number-field-default, number-field-stark, number-field-glass, number-field-flat, number-field-matte
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, input:none, increment:none, decrement:none
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
import { useNumberField } from "$lib/design/behaviors/number-field/index.js";
import { numberFieldAnatomy } from "$lib/design/primitives/number-field/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { NumberFieldProps, NumberFieldSize } from "./types.js";

const SIZE: Record<NumberFieldSize, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-4 text-base",
};

let {
	value,
	onValueChange,
	min,
	max,
	step = 1,
	disabled = false,
	readonly: readOnly = false,
	required = false,
	valueText,
	size = "md",
	preset = "default",
	"aria-label": ariaLabel,
	"aria-describedby": ariaDescribedby,
	class: className,
	...rest
}: NumberFieldProps = $props();

const hook = useNumberField({
	get value() {
		return value;
	},
	get onValueChange() {
		return onValueChange;
	},
	get min() {
		return min;
	},
	get max() {
		return max;
	},
	get step() {
		return step;
	},
	get disabled() {
		return disabled;
	},
	get readonly() {
		return readOnly;
	},
	get required() {
		return required;
	},
	get valueText() {
		return valueText;
	},
	get "aria-label"() {
		return ariaLabel;
	},
	get "aria-describedby"() {
		return ariaDescribedby;
	},
});

const m = $derived(resolveMacro({ kind: "number-field", preset }));
</script>

<div
	{...numberFieldAnatomy.attrs.root}
	{...hook.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("inline-flex items-center gap-1", className)}
>
	<button
		{...numberFieldAnatomy.attrs.decrement}
		{...hook.decrement}
		class="inline-flex items-center justify-center size-8 rounded-md border disabled:opacity-50"
	>
		−
	</button>

	<input
		{...numberFieldAnatomy.attrs.input}
		{...hook.input}
		class={cn(
			"w-full bg-transparent outline-none rounded-md border text-center",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size] ?? SIZE.md)}
	/>

	<button
		{...numberFieldAnatomy.attrs.increment}
		{...hook.increment}
		class="inline-flex items-center justify-center size-8 rounded-md border disabled:opacity-50"
	>
		+
	</button>
</div>
