<!--
	@component Text
	@kind text

	ColdLight Text — presentational typography component.
	No ARIA hook needed. Semantic element via `as` prop. Styling via recipe + useColdLight.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { textRecipe } from "./recipe.js";
import type { TextProps } from "./types.js";

let {
	as = "span",
	size = "base",
	weight = "normal",
	color = "primary",
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
	children,
	class: className,
	...rest
}: TextProps = $props();

const visual = useColdLight(() => ({
	preset: preset ?? "text-default",
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

const classes = $derived(
	cn(textRecipe({ size, weight, color }), visual.segments, visual.radius, className),
);
</script>

{#if as === "p"}
<p data-kind="text" data-slot="root" {...rest} class={classes} data-encoding={visual.encoding || undefined}>{@render children?.()}</p>
{:else if as === "label"}
<label data-kind="text" data-slot="root" {...rest} class={classes} data-encoding={visual.encoding || undefined}>{@render children?.()}</label>
{:else if as === "em"}
<em data-kind="text" data-slot="root" {...rest} class={classes} data-encoding={visual.encoding || undefined}>{@render children?.()}</em>
{:else if as === "strong"}
<strong data-kind="text" data-slot="root" {...rest} class={classes} data-encoding={visual.encoding || undefined}>{@render children?.()}</strong>
{:else if as === "small"}
<small data-kind="text" data-slot="root" {...rest} class={classes} data-encoding={visual.encoding || undefined}>{@render children?.()}</small>
{:else}
<span data-kind="text" data-slot="root" {...rest} class={classes} data-encoding={visual.encoding || undefined}>{@render children?.()}</span>
{/if}
