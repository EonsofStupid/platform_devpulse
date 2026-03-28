<!--
	@component PIN Input
	@kind pin-input
	@layer component
	@category interactive
	@description Segmented single-character input fields for entering verification codes or PINs
	@container false
	@compound true
	@blockCategory form
	@defaultStyle pin-input-default
	@styleIds pin-input-default
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, cell:none, label:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
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
const classes = $derived(cn(className));
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
