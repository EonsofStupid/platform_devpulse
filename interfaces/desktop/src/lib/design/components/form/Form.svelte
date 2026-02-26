<!--
	@component Form
	@kind form
	@layer components

	ColdLight Form — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Single root slot. Native <form> element with submit/reset handling.
-->
<script lang="ts">
	import type { FormComponentProps } from "./types.js";
	import { createForm } from "$lib/design/builders/form/index.js";
	import FormRoot from "$lib/design/primitives/form/Form.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { formRecipe } from "./recipe.js";

	let {
		size = "md",
		label,
		disabled = false,
		pending = false,
		onSubmit,
		onReset,
		children,
		class: className,
		...rest
	}: FormComponentProps = $props();

	const builder = createForm({
		label: () => label,
		disabled: () => disabled,
		pending: () => pending,
		onSubmit,
		onReset,
	});

	const classes = $derived(cn(formRecipe({ size }), className));
</script>

<FormRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</FormRoot>
