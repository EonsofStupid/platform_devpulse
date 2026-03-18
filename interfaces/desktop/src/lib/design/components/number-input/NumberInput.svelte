<!--
	@component NumberInput
	@kind number-input
	@layer components

	ColdLight NumberInput — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, input, increment, decrement.
	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
-->
<script lang="ts">
import { createNumberInput } from "$lib/design/api/dsadapters/coldlight/_internal/number-input/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import NumberInputRoot from "$lib/design/primitives/number-input/NumberInput.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { numberInputButtonRecipe, numberInputInputRecipe, numberInputRecipe } from "./recipe.js";
import type { NumberInputComponentProps } from "./types.js";

let {
	size = "md",
	value = 0,
	onValueChange,
	min,
	max,
	step = 1,
	disabled = false,
	readonly: readOnly = false,
	required = false,
	valueText,
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
}: NumberInputComponentProps = $props();

const builder = createNumberInput({
	value: () => value,
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from builder
	onValueChange: (v: any) => onValueChange?.(v),
	min: () => min,
	max: () => max,
	step: () => step,
	disabled: () => disabled,
	readonly: () => readOnly,
	required: () => required,
	valueText: () => valueText,
	get "aria-label"() {
		return rest["aria-label"];
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
	cn(numberInputRecipe({ size }), visual.segments, visual.radius, className),
);
const inputClasses = $derived(cn(numberInputInputRecipe({ size })));
const buttonClasses = $derived(cn(numberInputButtonRecipe({ size })));
</script>

<NumberInputRoot {...builder.root} {...rest} class={rootClasses} data-encoding={visual.encoding || undefined}>
	<button {...builder.decrement} class={buttonClasses}>
		<span aria-hidden="true">-</span>
	</button>
	<input {...builder.input} class={inputClasses} />
	<button {...builder.increment} class={buttonClasses}>
		<span aria-hidden="true">+</span>
	</button>
	{@render children?.()}
</NumberInputRoot>
