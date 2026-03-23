<!--
	@component Steps
	@kind steps
	@layer components
	ColdLight Steps — builder-driven. Builder owns ARIA. Component adds composition.
-->
<script lang="ts">
import { createSteps } from "$lib/design/api/dsadapters/coldlight/_internal/steps/index.js";
import StepsRoot from "$lib/design/primitives/steps/Steps.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { stepsComposition } from "./composition.js";
import type { StepsComponentProps } from "./types.js";

let {
	size = "md",
	orientation = "horizontal",
	activeStep = 0,
	onActiveStepChange,
	label,
	linear = true,
	disabled = false,
	children,
	class: className,
	...rest
}: StepsComponentProps = $props();

const builder = createSteps({
	get activeStep() {
		return activeStep;
	},
	onActiveStepChange: (v: number) => onActiveStepChange?.(v),
	get label() {
		return label;
	},
	get linear() {
		return linear;
	},
	get disabled() {
		return disabled;
	},
});

const classes = $derived(
	cn(stepsComposition({ size, orientation }), className));
</script>

<StepsRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</StepsRoot>
