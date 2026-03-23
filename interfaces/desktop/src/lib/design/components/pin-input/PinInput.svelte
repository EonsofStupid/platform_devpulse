<!--
	@component PinInput
	@kind pin-input
	@layer components

	ColdLight PinInput — 8-axis visual system.
	StyleMacro provides visual styling.

	Renders a row of individual character input fields for PIN/OTP entry.
-->
<script lang="ts">
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
	...rest
}: PinInputComponentProps = $props();

// Resolve ColdLight visual props
const classes = $derived(cn( className));
</script>

<div
	{...rest}
	class={classes}
	role="group"
	data-kind="pin-input"
	data-slot="root"
	aria-disabled={disabled || undefined}
>
	{@render children?.()}
</div>
