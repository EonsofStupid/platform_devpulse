<!--
	@component FormField
	@kind form-field
	@layer components

	ColdLight FormField — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Compound builder with slots: root, label, control, description, error.
	Provides aria-describedby, aria-invalid, aria-required linking.
-->
<script lang="ts">
	import type { FormFieldComponentProps } from "./types.js";
	import { createFormField } from "$lib/design/api/dsadapters/coldlight/_internal/form-field/index.js";
	import FormFieldRoot from "$lib/design/primitives/form-field/FormField.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import {
		formFieldRecipe,
		formFieldLabelRecipe,
		formFieldControlRecipe,
		formFieldDescriptionRecipe,
		formFieldErrorRecipe,
	} from "./recipe.js";

	let {
		size = "md",
		label,
		description,
		error,
		invalid = false,
		required = false,
		disabled = false,
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
	}: FormFieldComponentProps = $props();

	const builder = createFormField({
		invalid: () => invalid,
		required: () => required,
		disabled: () => disabled,
		error: () => error,
	});

	// Resolve ColdLight visual props
	const visual = useColdLight(
		() => ({
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
		}),
	);

	const rootClasses = $derived(cn(formFieldRecipe({ size }), visual.segments, visual.radius, className));
	const labelClasses = $derived(cn(formFieldLabelRecipe({ size })));
	const controlClasses = $derived(cn(formFieldControlRecipe()));
	const descriptionClasses = $derived(cn(formFieldDescriptionRecipe({ size })));
	const errorClasses = $derived(cn(formFieldErrorRecipe({ size })));
</script>

<FormFieldRoot {...builder.root} {...rest} class={rootClasses} data-encoding={visual.encoding || undefined}>
	{#if label}
		<label {...builder.label} class={labelClasses}>{label}</label>
	{/if}
	<div {...builder.control} class={controlClasses}>
		{@render children?.()}
	</div>
	{#if description}
		<p {...builder.description} class={descriptionClasses}>{description}</p>
	{/if}
	{#if invalid && error}
		<p {...builder.error} class={errorClasses}>{error}</p>
	{/if}
</FormFieldRoot>
