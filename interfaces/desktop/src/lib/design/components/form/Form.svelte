<!--
	@component Form
	@kind form
	@layer components

	ColdLight Form — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds composition classes.

	Single root slot. Native <form> element with submit/reset handling.
-->
<script lang="ts">
import { createForm } from "$lib/design/api/dsadapters/coldlight/_internal/form/index.js";
import FormRoot from "$lib/design/primitives/form/Form.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { formComposition } from "./composition.js";
import type { FormComponentProps } from "./types.js";

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
		onSubmit: (e: any) => onSubmit?.(e),
	onReset: () => onReset?.(),
});

// Resolve ColdLight visual props
const classes = $derived(cn(formComposition({ size }), className));
</script>

<FormRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</FormRoot>
