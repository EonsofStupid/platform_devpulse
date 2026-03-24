<!--
	@component FormField
	@kind form-field
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useFormField } from "$lib/design/primitives/form-field/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { FormFieldComponentProps } from "./types.js";
let { size = "md", label, description, error, invalid = false, required = false, disabled = false, children, class: className, ...rest }: FormFieldComponentProps = $props();
const field = $derived(useFormField({ invalid, required, disabled }));
const styleId = "form-field-default";
</script>
<StyleMacro kind="form-field" style={styleId}>
	<div {...field.root} class={cn("flex flex-col gap-1.5", className)} {...rest}>
		{#if label}<label {...field.label} data-kind="form-field" data-slot="label" class="text-sm font-medium">{label}{#if required}<span aria-hidden="true" class="text-red-500 ml-0.5">*</span>{/if}</label>{/if}
		<div data-kind="form-field" data-slot="control">{@render children?.()}</div>
		{#if description}<p {...field.description} data-kind="form-field" data-slot="description" class="text-xs">{description}</p>{/if}
		{#if invalid && error}<p {...field.error} data-kind="form-field" data-slot="error" class="text-xs text-red-500">{error}</p>{/if}
	</div>
</StyleMacro>
