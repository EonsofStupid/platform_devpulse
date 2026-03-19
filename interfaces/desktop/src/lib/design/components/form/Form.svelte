<!--
	@component Form
	@kind form
	@layer components

	ColdLight Form — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.

	Single root slot. Native <form> element with submit/reset handling.
-->
<script lang="ts">
import { createForm } from "$lib/design/api/dsadapters/coldlight/_internal/form/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import FormRoot from "$lib/design/primitives/form/Form.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { formRecipe } from "./recipe.js";
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
	// ColdLight 8-axis props
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
	// Rest spread
	...rest
}: FormComponentProps = $props();

const builder = createForm({
	label: () => label,
	disabled: () => disabled,
	pending: () => pending,
	// biome-ignore lint/suspicious/noExplicitAny: submit event type from builder
	onSubmit: (e: any) => onSubmit?.(e),
	onReset: () => onReset?.(),
});

// Resolve ColdLight visual props
const visual = useColdLight(() => ({
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
	size,
}));

const classes = $derived(cn(formRecipe({ size }), visual.segments, visual.radius, className));
</script>

<FormRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</FormRoot>
