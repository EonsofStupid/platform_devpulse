<!--
	@component Textarea
	@kind textarea
	@layer components

	ARIA + state only. Builder-driven. ZERO visual.
	Self-closing element — no children.
-->
<script lang="ts">
	import type { TextareaComponentProps } from "./types.js";
	import { createTextarea } from "$lib/design/api/adapters/coldlight/_internal/textarea/index.js";
	import TextareaRoot from "$lib/design/primitives/textarea/Textarea.svelte";

	let {
		value,
		invalid = false,
		rows = 3,
		disabled = false,
		readonly: readonlyProp = false,
		required = false,
		onValueChange,
		class: className,
		...rest
	}: TextareaComponentProps = $props();

	const builder = createTextarea({
		value: () => value as string | undefined,
		disabled: () => disabled,
		readonly: () => readonlyProp,
		required: () => required,
		invalid: () => invalid,
		rows: () => rows,
		onValueChange: (v: any) => onValueChange?.(v),
	});
</script>

<TextareaRoot
	{...builder.root}
	{...rest}
	class={className}
/>
