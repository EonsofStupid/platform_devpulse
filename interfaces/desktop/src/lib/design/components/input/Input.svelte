<!--
	@component Input
	@kind input
	@layer components

	ARIA + state only. Builder-driven. ZERO visual.
	Self-closing element — no children.
-->
<script lang="ts">
	import type { InputComponentProps } from "./types.js";
	import { createInput } from "$lib/design/api/adapters/coldlight/_internal/input/index.js";
	import InputRoot from "$lib/design/primitives/input/Input.svelte";

	let {
		value,
		invalid = false,
		disabled = false,
		readonly: readonlyProp = false,
		required: requiredProp = false,
		onValueChange,
		class: className,
		...rest
	}: InputComponentProps = $props();

	const builder = createInput({
		value: () => value as string | undefined,
		disabled: () => disabled,
		readonly: () => readonlyProp,
		required: () => requiredProp,
		invalid: () => invalid,
		onValueChange: (v: any) => onValueChange?.(v),
	});
</script>

<InputRoot
	{...builder.root}
	{...rest}
	class={className}
/>
