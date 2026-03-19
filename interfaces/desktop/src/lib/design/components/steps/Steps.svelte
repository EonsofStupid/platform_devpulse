<!--
	@component Steps
	@kind steps
	@layer components
	ColdLight Steps — builder-driven. Builder owns ARIA. Component adds recipe.
-->
<script lang="ts">
import { createSteps } from "$lib/design/api/dsadapters/coldlight/_internal/steps/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import StepsRoot from "$lib/design/primitives/steps/Steps.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { stepsRecipe } from "./recipe.js";
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

const classes = $derived(
	cn(stepsRecipe({ size, orientation }), visual.segments, visual.radius, className),
);
</script>

<StepsRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</StepsRoot>
