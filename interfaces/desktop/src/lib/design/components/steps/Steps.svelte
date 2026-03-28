<!--
	@component Steps
	@kind steps
	@layer component
	@category composite
	@description Multi-step progress indicator showing sequential workflow stages and current position
	@container true
	@containerSlots content
	@compound true
	@blockCategory navigation
	@defaultStyle steps-default
	@styleIds steps-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, step:none, indicator:none, separator:none, title:none, description:none, content:none
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
import { useSteps } from "$lib/design/behaviors/steps/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { StepsComponentProps } from "./types.js";

let {
	size = "md",
	orientation = "horizontal",
	activeStep = 0,
	onActiveStepChange,
	label,
	linear = true,
	disabled = false,
	preset = "default",
	children,
	class: className,
	...rest
}: StepsComponentProps = $props();
const steps = $derived(useSteps({ label, activeStep, disabled }));
const m = $derived(resolveMacro({ kind: "steps", preset }));
</script>
<div {...steps.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} data-slot="root" data-orientation={orientation} data-active-step={activeStep} class={cn("flex", orientation === "horizontal" ? "flex-row items-center" : "flex-col", className)} {...rest}>{@render children?.()}</div>
