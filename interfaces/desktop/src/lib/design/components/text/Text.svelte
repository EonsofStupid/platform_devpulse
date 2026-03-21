<!--
	@component Text
	@kind text

	ColdLight Text — DUMB component.
	Semantic element via `as` prop. Recipe provides size/weight/color classes.
	Visual treatment via class prop from caller.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { textRecipe } from "./recipe.js";
import type { TextProps } from "./types.js";

let {
	as = "span",
	size = "base",
	weight = "normal",
	color = "primary",
	children,
	class: className,
	...rest
}: TextProps = $props();

const classes = $derived(cn(textRecipe({ size, weight, color }), className));
</script>

{#if as === "p"}
<p data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</p>
{:else if as === "label"}
<label data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</label>
{:else if as === "em"}
<em data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</em>
{:else if as === "strong"}
<strong data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</strong>
{:else if as === "small"}
<small data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</small>
{:else}
<span data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</span>
{/if}
