<!--
	@component Label
	@kind label
	@layer component
	@category content
	@description Accessible text label associated with a form control via htmlFor
	@container false
	@compound false
	@blockCategory form
	@defaultStyle label-default
	@styleIds label-default, label-stark, label-glass, label-flat, label-matte
	@requiredAxes typography, color
	@slots root:all
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
import { useLabel } from "$lib/design/behaviors/display/label/use-label.svelte.js";
import { labelAnatomy } from "$lib/design/primitives/label/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { LabelProps, LabelSize } from "./types.js";

const SIZE: Record<LabelSize, string> = {
	sm: "text-xs",
	md: "text-sm",
	lg: "text-base",
};

let {
	size = "md",
	preset = "default",
	htmlFor,
	disabled = false,
	required = false,
	children,
	class: className,
	...rest
}: LabelProps = $props();

const label = $derived(useLabel({ htmlFor, disabled }));
const m = $derived(renderForge({ kind: "label", preset }));
</script>

<label
	{...labelAnatomy.attrs.root}
	{...label.root}
	for={htmlFor}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	data-disabled={disabled || undefined}
	class={cn(
		"font-medium",
		disabled && "opacity-60 pointer-events-none",
		SIZE[size] ?? SIZE.md,
		className)}
>
	{@render children?.()}
	{#if required}<span aria-hidden="true" class="text-red-500 ms-0.5">*</span>{/if}
</label>
