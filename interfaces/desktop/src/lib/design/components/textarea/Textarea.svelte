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
import { textareaAnatomy, useTextarea } from "$lib/design/behaviors/inputs/textarea/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TextareaProps } from "./types.js";

type TextareaSize = "sm" | "md" | "lg";

const SIZE: Record<TextareaSize, string> = {
	sm: "text-sm px-2.5 py-1.5",
	md: "text-sm px-3 py-2",
	lg: "text-base px-4 py-2.5",
};

let {
	size = "md",
	disabled = false,
	readonly: readOnly = false,
	required = false,
	invalid = false,
	rows,
	value = $bindable(""),
	onValueChange,
	preset = "default",
	class: className,
	...rest
}: TextareaProps = $props();

const textarea = $derived(useTextarea({ disabled, readonly: readOnly, required, invalid }));
const m = $derived(renderForge({ kind: "textarea", preset }));
</script>

<textarea
		{...textareaAnatomy.attrs.input}
		aria-invalid={textarea.root["aria-invalid"]}
		aria-required={textarea.root["aria-required"]}
		aria-disabled={textarea.root["aria-disabled"]}
		aria-readonly={textarea.root["aria-readonly"]}
		{disabled}
		readonly={readOnly}
		{required}
		{rows}
		{value}
		placeholder={rest.placeholder}
		aria-label={rest["aria-label"]}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		data-invalid={invalid || undefined}
		class={cn(
			"w-full rounded-md border bg-transparent",
			"placeholder:text-muted-foreground",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size as TextareaSize] ?? SIZE.md,
			className)}
		oninput={(e) => {
			const next = (e.target as HTMLTextAreaElement).value;
			value = next;
			onValueChange?.(next);
		}}
	></textarea>
