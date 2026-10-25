<!--
  @file primitives/Textarea.svelte
  @layer primitives

  Textarea with ARIA error/description linking.
  Exposes ref for form integration.
-->
<script lang="ts">
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends OmitStyle<HTMLTextAreaElement>, BaseProps {
	/** Textarea value (bindable) */
	value?: string;
	/** ID of error/description element for aria-describedby */
	describedBy?: string;
	/** Invalid state */
	invalid?: boolean;
	/** Disabled state */
	disabled?: boolean;
	/** Readonly state */
	readonly?: boolean;
	/** Placeholder text */
	placeholder?: string;
	/** Textarea name */
	name?: string;
	/** Required field */
	required?: boolean;
	/** Number of rows */
	rows?: number;
	/** Auto-resize */
	autoResize?: boolean;
}

let {
	value = $bindable(""),
	describedBy,
	invalid = false,
	disabled = false,
	readonly = false,
	placeholder,
	name,
	required = false,
	rows = 3,
	autoResize = false,
	class: className = "",
	"data-id": id,
	...rest
}: Props = $props();

stripStyleProp(rest, "Textarea");

let textareaRef = $state<HTMLTextAreaElement>();

// Auto-resize effect
$effect(() => {
	if (autoResize && textareaRef) {
		textareaRef.style.height = "auto";
		textareaRef.style.height = `${textareaRef.scrollHeight}px`;
	}
});

export function focus() {
	textareaRef?.focus();
}

export function blur() {
	textareaRef?.blur();
}

export function select() {
	textareaRef?.select();
}
</script>

<textarea
  bind:this={textareaRef}
  bind:value
  aria-invalid={invalid || undefined}
  aria-describedby={describedBy}
  {disabled}
  {readonly}
  {placeholder}
  {name}
  {required}
  {rows}
  class={className}
  data-kind="primitive"
  data-name="Textarea"
  data-part="root"
  data-id={id}
  {...rest}
></textarea>
