<!--
	@component Steps
	@kind steps
	@layer components
	ColdLight Steps — builder-driven. Builder owns ARIA. Component adds recipe.
-->
<script lang="ts">
	import type { StepsComponentProps } from "./types.js";
	import { createSteps } from "$lib/design/builders/steps/index.js";
	import StepsRoot from "$lib/design/primitives/steps/Steps.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { stepsRecipe } from "./recipe.js";

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
		get activeStep() { return activeStep; },
		onActiveStepChange,
		get label() { return label; },
		get linear() { return linear; },
		get disabled() { return disabled; },
	});

	const classes = $derived(cn(stepsRecipe({ size, orientation }), className));
</script>

<StepsRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</StepsRoot>
