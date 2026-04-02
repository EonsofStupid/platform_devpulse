<!--
	@component Form Field
	@kind form-field
	@layer component
	@category structural
	@description Wrapper providing label, description, and error message layout for a single form control
	@container true
	@containerSlots control
	@compound true
	@blockCategory form
	@defaultStyle form-field-default
	@styleIds form-field-default
	@requiredAxes typography, color
	@slots root:all, label:none, description:none, control:none, error:none
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
import { useFormField } from "$lib/design/behaviors/form-field/index.js";
import { formFieldAnatomy } from "$lib/design/primitives/form-field/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { FormFieldComponentProps } from "./types.js";

let {
	preset = "default",
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
const field = $derived(useFormField({ invalid, required, disabled }));
const m = $derived(renderForge({ kind: "form-field", preset }));
</script>
<div {...formFieldAnatomy.attrs.root} {...field.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={cn("flex flex-col gap-1.5", className)} {...rest}>
		{#if label}<label {...field.label} data-kind="form-field" data-slot="label" class="text-sm font-medium">{label}{#if required}<span aria-hidden="true" class="text-red-500 ml-0.5">*</span>{/if}</label>{/if}
		<div data-kind="form-field" data-slot="control">{@render children?.()}</div>
		{#if description}<p {...field.description} data-kind="form-field" data-slot="description" class="text-xs">{description}</p>{/if}
		{#if invalid && error}<p {...field.error} data-kind="form-field" data-slot="error" class="text-xs text-red-500">{error}</p>{/if}
	</div>
