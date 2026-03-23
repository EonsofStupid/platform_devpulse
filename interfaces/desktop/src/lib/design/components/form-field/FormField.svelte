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
import { createFormField } from "$lib/design/api/dsadapters/coldlight/_internal/form-field/index.js";
import FormFieldRoot from "$lib/design/primitives/form-field/FormField.svelte";
import { cn } from "$lib/design/utils/cn.js";
import {
	formFieldControlRecipe,
	formFieldDescriptionRecipe,
	formFieldErrorRecipe,
	formFieldLabelRecipe,
	formFieldRecipe,
} from "./recipe.js";
import type { FormFieldComponentProps } from "./types.js";

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
	...rest
}: FormFieldComponentProps = $props();

const builder = createFormField({
	invalid: () => invalid,
	required: () => required,
	disabled: () => disabled,
	error: () => error,
});

// Resolve ColdLight visual props
const rootClasses = $derived(
	cn(formFieldRecipe({ size }), className));
const labelClasses = $derived(cn(formFieldLabelRecipe({ size })));
const controlClasses = $derived(cn(formFieldControlRecipe()));
const descriptionClasses = $derived(cn(formFieldDescriptionRecipe({ size })));
const errorClasses = $derived(cn(formFieldErrorRecipe({ size })));
</script>

<FormFieldRoot {...builder.root} {...rest} class={rootClasses}>
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
