<!--
	@component Textarea
	@kind textarea
	@layer components

	Multi-line text input. Hook (ARIA) + StyleMacro (visual).
	Handles disabled, readonly, required, invalid states.
-->
<script lang="ts">
import { useTextarea } from "$lib/design/primitives/textarea/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
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
	onValueChange,
	class: className,
	...rest
}: TextareaProps = $props();

const textarea = $derived(useTextarea({ disabled, readonly: readOnly, required, invalid }));
const styleId = "textarea-default";
</script>

<StyleMacro kind="textarea" style={styleId}>
	<textarea
		{...textarea.root}
		{disabled}
		readonly={readOnly}
		{required}
		{rows}
		data-kind="textarea"
		data-slot="root"
		data-invalid={invalid || undefined}
		class={cn(
			"w-full rounded-md border bg-transparent",
			"placeholder:text-muted-foreground",
			"focus-visible:outline-2 focus-visible:outline-offset-2",
			"disabled:pointer-events-none disabled:opacity-50",
			SIZE[size as TextareaSize] ?? SIZE.md,
			className)}
		oninput={(e) => onValueChange?.((e.target as HTMLTextAreaElement).value)}
		{...rest}
	></textarea>
</StyleMacro>
