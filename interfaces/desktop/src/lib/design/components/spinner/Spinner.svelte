<!--
	@component Spinner
	@kind spinner
	@layer components

	ColdLight Spinner — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createSpinner } from "$lib/design/api/dsadapters/coldlight/_internal/spinner/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import SpinnerRoot from "$lib/design/primitives/spinner/Spinner.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { spinnerRecipe } from "./recipe.js";
import type { SpinnerProps } from "./types.js";

let {
	size = "md",
	active = true,
	onActiveChange,
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
	class: className,
	...rest
}: SpinnerProps = $props();

const builder = createSpinner({
	active: () => active,
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from builder
	onActiveChange: (v: any) => onActiveChange?.(v),
});

const visual = useColdLight(() => ({
	preset: preset ?? "spinner-default",
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
}));

const classes = $derived(cn(spinnerRecipe({ size }), visual.segments, visual.radius, className));
</script>

<SpinnerRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined} />
