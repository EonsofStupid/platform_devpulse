<!--
	@component Callout
	@kind callout
	@layer components

	ColdLight Callout — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createCallout } from "$lib/design/components/callout/index.js";
import actual parts to make this component";
import { cn } from "$lib/design/utils/cn.js";
import { calloutRecipe } from "./recipe.js";
import type { CalloutProps } from "./types.js";

let {
	variant = "info",
	children,
	class: className,
	...rest
}: CalloutProps = $props();

const builder = createCallout();

const classes = $derived(cn(calloutRecipe({ variant }), className));
</script>

<CalloutRoot {...builder.root} {...rest} class={classes} data-state={variant}>
	{@render children?.()}
</CalloutRoot>
