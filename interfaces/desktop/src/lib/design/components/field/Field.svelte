<!--
	@component Field
	@kind field
	@layer component
	@category interactive
	@description Universal form field container with label, description, and error
	@container true
	@compound true
	@blockCategory form
	@defaultStyle field-default
	@styleIds field-default, field-stark, field-glass, field-flat, field-matte
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, label:none, control:none, description:none, error:none
	@defaults {
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"color": "var(--text-primary)"
}
-->
<script lang="ts">
import { fieldAnatomy, useField } from "$lib/design/behaviors/inputs/field/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { FieldProps } from "./types.js";

let {
	label: labelText,
	description: descriptionText,
	error: errorText,
	invalid = false,
	required = false,
	disabled = false,
	preset = "default",
	children,
	class: className,
	...rest
}: FieldProps = $props();

const hook = useField({
	get invalid() {
		return invalid;
	},
	get required() {
		return required;
	},
	get disabled() {
		return disabled;
	},
	get error() {
		return errorText;
	},
});

const m = $derived(renderForge({ kind: "field", preset }));
</script>

<div
	{...fieldAnatomy.attrs.root}
	{...hook.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("flex flex-col gap-1.5", className)}
>
	{#if labelText}
		<label {...fieldAnatomy.attrs.label} {...hook.label} class="text-sm font-medium">
			{labelText}
			{#if required}<span aria-hidden="true"> *</span>{/if}
		</label>
	{/if}

	{@render children?.()}

	{#if descriptionText && !invalid}
		<div {...fieldAnatomy.attrs.description} {...hook.description} class="text-xs opacity-70">
			{descriptionText}
		</div>
	{/if}

	{#if invalid && errorText}
		<div {...fieldAnatomy.attrs.error} {...hook.error} class="text-xs">
			{errorText}
		</div>
	{/if}
</div>
