<!--
	@component TextField
	@kind text-field

	THE PRODUCT. Hook (ARIA label/input linkage) + StyleMacro (visual).
	Size → structural Tailwind classes.
-->
<script lang="ts">
import { useTextField } from "$lib/design/primitives/text-field/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
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
	leading,
	trailing,
	class: className,
	...rest
}: TextFieldProps = $props();

const field = $derived(useTextField({
	value,
	onValueChange,
	type,
	placeholder,
	disabled,
	readonly: readOnly,
	required,
	invalid,
	error: errorText,
}));

const styleId = "text-field-default";
</script>

<StyleMacro kind="text-field" style={styleId}>
	<div {...field.root} class={className}>
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
				{...field.input}
				{...rest}
				class={cn(
					"w-full bg-transparent outline-none rounded-md border",
					"focus-visible:outline-2 focus-visible:outline-offset-2",
					"disabled:pointer-events-none disabled:opacity-50",
					SIZE[size] ?? SIZE.md,
					leading && "pl-10",
					trailing && "pr-10",
				)}
				data-kind="text-field"
				data-slot="input"
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
</StyleMacro>
