<!--
	@component TagsInput
	@kind tags-input
	@layer components

	ColdLight TagsInput — 8-axis visual system.
	useColdLight() resolves visual props.

	Composite widget with editable tags and an inline text input.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import type { TagsInputComponentProps } from "./types.js";

let {
	size = "md",
	value = [],
	onValueChange,
	disabled = false,
	invalid = false,
	max,
	placeholder = "Add tag...",
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
}: TagsInputComponentProps = $props();

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

const classes = $derived(cn(visual.segments, visual.radius, className));
</script>

<div
	{...rest}
	class={classes}
	data-kind="tags-input"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	aria-disabled={disabled || undefined}
	aria-invalid={invalid || undefined}
>
	{@render children?.()}
</div>
