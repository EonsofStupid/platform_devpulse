<!--
	@component Checkbox
	@kind checkbox
	@layer components

	ARIA + state only. Builder-driven. ZERO visual.
-->
<script lang="ts">
	import type { CheckboxComponentProps } from "./types.js";
	import { createCheckbox } from "$lib/design/api/adapters/coldlight/_internal/checkbox/index.js";
	import CheckboxRoot from "$lib/design/primitives/checkbox/Checkbox.svelte";

	let {
		checked = false,
		indeterminate = false,
		disabled = false,
		onCheckedChange,
		children,
		class: className,
		...rest
	}: CheckboxComponentProps = $props();

	const builder = createCheckbox({
		checked: () => checked,
		indeterminate: () => indeterminate,
		disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
	});
</script>

<CheckboxRoot
	{...builder.root}
	{...rest}
	class={className}
>
	{@render children?.()}
</CheckboxRoot>
