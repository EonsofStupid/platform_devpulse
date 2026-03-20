<!--
	@component TextField
	@kind text-field

	ColdLight TextField — input with label, description, error.
	Primitive provides ARIA linkage (label→input, error→aria-describedby).
	Component adds visual via useColdLight.
-->
<script lang="ts">
import { useTextField } from "$lib/design/primitives/text-field/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TextFieldProps, TextFieldSize } from "./text-field.types.js";

const SIZE_CLASSES: Record<TextFieldSize, string> = {
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

const visual = useColdLight(() => ({
	preset: preset ?? "input-default",
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "md",
	size,
}));

const inputClasses = $derived(cn(
	"w-full bg-transparent outline-none",
	SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	visual.segments,
	visual.radius,
	"border border-border-subtle",
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
	"disabled:pointer-events-none disabled:opacity-50",
	"placeholder:text-text-muted",
	invalid && "border-[var(--color-red-400)]",
	className,
));
</script>

<div {...field.root}>
	{#if labelText}
		<label {...field.label} class="text-sm font-medium text-text-primary mb-1 block">
			{labelText}
			{#if required}<span class="text-[var(--color-red-400)]" aria-hidden="true"> *</span>{/if}
		</label>
	{/if}

	<div class="relative flex items-center">
		{#if leading}
			<span class="absolute left-3 flex items-center text-text-muted">
				{@render leading()}
			</span>
		{/if}

		<input
			{...field.input}
			{...rest}
			class={cn(inputClasses, leading && "pl-10", trailing && "pr-10")}
			data-encoding={visual.encoding || undefined}
		/>

		{#if trailing}
			<span class="absolute right-3 flex items-center text-text-muted">
				{@render trailing()}
			</span>
		{/if}
	</div>

	{#if descriptionText && !invalid}
		<p {...field.description} class="text-xs text-text-muted mt-1">{descriptionText}</p>
	{/if}

	{#if invalid && errorText}
		<p {...field.error} class="text-xs text-[var(--color-red-400)] mt-1">{errorText}</p>
	{/if}
</div>
