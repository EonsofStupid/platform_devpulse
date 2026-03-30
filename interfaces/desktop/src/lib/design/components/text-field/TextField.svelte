<!--
	@component Text Field
	@kind text-field
	@layer component
	@category interactive
	@description Single-line text input with integrated label and validation support
	@container false
	@compound true
	@blockCategory form
	@defaultStyle text-field-default
	@styleIds text-field-default, text-field-stark, text-field-glass, text-field-flat, text-field-matte
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, input:none, label:none
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
import { useTextField } from "$lib/design/behaviors/text-field/index.js";
import { textFieldAnatomy } from "$lib/design/primitives/text-field/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { TextFieldProps, TextFieldSize } from "./text-field.types.js";

const SIZE: Record<TextFieldSize, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-4 text-base",
};

let {
	label: labelText,
	description: descriptionText,
	error: errorText,
	value,
	onValueChange,
	type = "text",
	placeholder,
	disabled = false,
	readonly: readOnly = false,
	required = false,
	invalid = false,
	size = "md",
	preset = "default",
	leading,
	trailing,
	class: className,
	...rest
}: TextFieldProps = $props();

const field = $derived(
	useTextField({
		value,
		onValueChange,
		type,
		placeholder,
		disabled,
		readonly: readOnly,
		required,
		invalid,
		error: errorText,
	}),
);

const m = $derived(resolveMacro({ kind: "text-field", preset }));
</script>

<div {...textFieldAnatomy.attrs.root} {...field.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={className}>
		{#if labelText}
			<label {...field.label} class="text-sm font-medium mb-1 block">
				{labelText}
				{#if required}<span aria-hidden="true"> *</span>{/if}
			</label>
		{/if}

		<div class="relative flex items-center">
			{#if leading}
				<span class="absolute left-3 flex items-center">
					{@render leading()}
				</span>
			{/if}

			<input
				{...textFieldAnatomy.attrs.input}
				{...field.input}
				{...rest}
				class={cn(
					"w-full bg-transparent outline-none rounded-md border",
					"focus-visible:outline-2 focus-visible:outline-offset-2",
					"disabled:pointer-events-none disabled:opacity-50",
					SIZE[size] ?? SIZE.md,
					leading && "pl-10",
					trailing && "pr-10")}
			/>

			{#if trailing}
				<span class="absolute right-3 flex items-center">
					{@render trailing()}
				</span>
			{/if}
		</div>

		{#if descriptionText && !invalid}
			<p {...field.description} class="text-xs mt-1">{descriptionText}</p>
		{/if}

		{#if invalid && errorText}
			<p {...field.error} class="text-xs mt-1">{errorText}</p>
		{/if}
	</div>
