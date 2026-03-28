<!--
	@component Callout
	@kind callout
	@layer component
	@category feedback
	@description Highlighted block drawing attention to supplementary or important information
	@container true
	@containerSlots content
	@compound true
	@blockCategory feedback
	@defaultStyle callout-default
	@styleIds callout-default, callout-info, callout-success, callout-warning, callout-error
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, icon:none, content:none
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
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { CalloutProps, CalloutVariant } from "./types.js";

const VARIANT_PRESETS: Record<CalloutVariant, string> = {
	info: "callout-info",
	success: "callout-success",
	warning: "callout-warning",
	error: "callout-error",
	tip: "callout-default",
};

let { variant = "info", children, class: className, ...rest }: CalloutProps = $props();

const m = $derived(resolveMacro({ kind: "callout", preset: variant }));
</script>

<div
	{...m.dataAttrs}
	data-slot="root"
	data-variant={variant}
	style={cssVarString(m.cssVars)}
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
