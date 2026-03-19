<!--
	@component PinInput
	@kind pin-input
	@layer components

	ColdLight PinInput — 8-axis visual system.
	useColdLight() resolves visual props.

	Renders a row of individual character input fields for PIN/OTP entry.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import type { PinInputComponentProps } from "./types.js";

let {
	size = "md",
	length = 4,
	value = "",
	onValueChange,
	onComplete,
	disabled = false,
	mask = false,
	placeholder = "\u25CB",
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
}: PinInputComponentProps = $props();

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
	role="group"
	data-kind="pin-input"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	aria-disabled={disabled || undefined}
>
	{@render children?.()}
</div>
