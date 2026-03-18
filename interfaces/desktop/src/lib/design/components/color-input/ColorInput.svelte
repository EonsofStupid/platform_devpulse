<!--
	@component ColorInput
	@kind color-input
	@layer components

	ColdLight ColorInput — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, swatch, input, label.
	WAI-ARIA: Native <input type="color"> semantics.
-->
<script lang="ts">
import { createColorInput } from "$lib/design/api/dsadapters/coldlight/_internal/color-input/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import ColorInputRoot from "$lib/design/primitives/color-input/ColorInput.svelte";
import { cn } from "$lib/design/primitives/types.js";
import {
	colorInputInputRecipe,
	colorInputLabelRecipe,
	colorInputRecipe,
	colorInputSwatchRecipe,
} from "./recipe.js";
import type { ColorInputComponentProps } from "./types.js";

let {
	size = "md",
	value = "#000000",
	onValueChange,
	disabled = false,
	required = false,
	invalid = false,
	label,
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	// Rest spread
	...rest
}: ColorInputComponentProps = $props();

const builder = createColorInput({
	value: () => value,
	onValueChange: (v: string) => onValueChange?.(v),
	disabled: () => disabled,
	required: () => required,
	invalid: () => invalid,
	get "aria-label"() {
		return rest["aria-label"];
	},
	get "aria-labelledby"() {
		return rest["aria-labelledby"];
	},
	get "aria-describedby"() {
		return rest["aria-describedby"];
	},
});

// Resolve ColdLight visual props
const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

const rootClasses = $derived(
	cn(colorInputRecipe({ size }), visual.segments, visual.radius, className),
);
const swatchClasses = $derived(cn(colorInputSwatchRecipe({ size })));
const inputClasses = $derived(cn(colorInputInputRecipe()));
const labelClasses = $derived(cn(colorInputLabelRecipe({ size })));
</script>

<ColorInputRoot {...builder.root} {...rest} class={rootClasses} data-encoding={visual.encoding || undefined}>
	<div {...builder.swatch} class={swatchClasses}></div>
	<input {...builder.input} class={inputClasses} />
	{#if label}
		<label {...builder.label} class={labelClasses}>{label}</label>
	{/if}
	{@render children?.()}
</ColorInputRoot>
