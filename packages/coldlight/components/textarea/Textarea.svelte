<!--
	@component Textarea
	@kind textarea
	@layer component
	@category interactive
	@description Multi-line text input for longer form content such as comments or descriptions
	@container false
	@compound true
	@blockCategory form
	@defaultStyle textarea-default
	@styleIds textarea-default
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
import type { TextareaResize } from "#coldlight/behaviors/inputs/textarea/index.js";
import { useTextarea } from "#coldlight/behaviors/inputs/textarea/index.js";
import { cssVarString, renderForge } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import type { TextareaProps, TextareaSize } from "./types.js";

const SIZE: Record<TextareaSize, string> = {
	sm: "text-sm px-2.5 py-1.5",
	md: "text-sm px-3 py-2",
	lg: "text-base px-4 py-2.5",
};

/** The resize affordance (layout); "auto" grows with the content. */
const RESIZE: Record<TextareaResize, string> = {
	none: "resize-none",
	vertical: "resize-y",
	horizontal: "resize-x",
	both: "resize",
	auto: "resize-none [field-sizing:content]",
};

let {
	label: labelText,
	description: descriptionText,
	error: errorText,
	value = $bindable(),
	defaultValue,
	onValueChange,
	rows,
	maxLength,
	resize = "vertical",
	autoResize = false,
	disabled = false,
	readonly: readOnly = false,
	required = false,
	invalid = false,
	size = "md",
	preset = "default",
	children,
	class: className,
	...rest
}: TextareaProps = $props();

// Called once, reading props through getters. Controlled when `value` is given or bound
// (`bind:value`); otherwise the textarea holds its value, starting from `defaultValue`.
const textarea = useTextarea({
	get label() {
		return labelText;
	},
	get description() {
		return descriptionText;
	},
	get error() {
		return errorText;
	},
	get value() {
		return value;
	},
	get defaultValue() {
		return defaultValue;
	},
	onValueChange: (next) => {
		// A bound or passed value follows the change; an unset one stays with the textarea.
		if (value !== undefined) value = next;
		onValueChange?.(next);
	},
	get maxLength() {
		return maxLength;
	},
	get disabled() {
		return disabled;
	},
	get readonly() {
		return readOnly;
	},
	get required() {
		return required;
	},
	get invalid() {
		return invalid;
	},
});

const m = $derived(renderForge({ kind: "textarea", preset }));

// The caller's attributes go on the textarea; its handlers add to the hook's (mergeProps chains them).
const inputAttrs = $derived(mergeProps(textarea.input, { rows }, rest));
</script>

<!-- The caller's class stays on the textarea, where it always went (the SQL console's font-mono). -->
<div {...textarea.root} class="flex w-full flex-col gap-1">
	{#if labelText}
		<label {...textarea.label} class="text-sm font-medium">
			{labelText}
			{#if required}<span aria-hidden="true"> *</span>{/if}
		</label>
	{/if}

	<textarea
		{...inputAttrs}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		class={cn(
			"w-full rounded-md border bg-transparent",
			"placeholder:text-muted-foreground",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size] ?? SIZE.md,
			RESIZE[autoResize ? "auto" : resize] ?? RESIZE.vertical,
			className,
		)}
	></textarea>

	{#if descriptionText && !invalid}
		<p {...textarea.description} class="text-xs">{descriptionText}</p>
	{/if}

	{#if invalid && errorText}
		<p {...textarea.error} class="text-xs">{errorText}</p>
	{/if}

	{#if textarea.count}
		<span {...textarea.counter} class="self-end text-xs">{textarea.count}</span>
	{/if}

	{@render children?.()}
</div>
