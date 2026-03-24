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
-->
<script lang="ts">
import { useSteps } from "$lib/design/primitives/steps/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { StepsComponentProps } from "./types.js";
let { size = "md", orientation = "horizontal", activeStep = 0, onActiveStepChange, label, linear = true, disabled = false, children, class: className, ...rest }: StepsComponentProps = $props();
const steps = $derived(useSteps({ label, activeStep, disabled }));
const styleId = "steps-default";
</script>
<StyleMacro kind="steps" style={styleId}>
	<div {...steps.root} data-kind="steps" data-slot="root" data-orientation={orientation} data-active-step={activeStep} class={cn("flex", orientation === "horizontal" ? "flex-row items-center" : "flex-col", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
