<!--
	@component Card (Root)
	@kind card
	@layer components

	ColdLight Card Root — compound structural surface container.
	Supports element polymorphism: div (default), a (link), button (clickable).
	Sets Svelte context for sub-components (Header, Title, Content, Footer, etc.).

	API follows Ark UI / Zag conventions:
	  - ids for composition
	  - dir for RTL
	  - disabled state
	  - element polymorphism (as)
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setCardContext } from "./context.js";
import type { CardRootProps } from "./types.js";
import { CARD_VARIANT_PRESETS } from "./types.js";

let {
	ids,
	as = "div",
	orientation = "vertical",
	variant = "default",
	label,
	labelledBy,
	href,
	target,
	disabled = false,
	dir = "ltr",
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
}: CardRootProps = $props();

const recipe = getRecipe("card.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

setCardContext({
	get classes() { return recipeClasses; },
	get orientation() { return orientation; },
	get dir() { return dir; },
	get ids() { return ids ?? {}; },
});

const visual = useColdLight(() => ({
	preset: preset ?? CARD_VARIANT_PRESETS[variant as keyof typeof CARD_VARIANT_PRESETS],
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "lg",
}));

const rootClasses = $derived(
	cn(
		recipeClasses.root,
		visual.segments,
		visual.radius,
		orientation === "horizontal" ? "flex-row" : "flex-col",
		"flex overflow-hidden",
		disabled ? "pointer-events-none opacity-60" : undefined,
		className,
	),
);
</script>

{#if as === "a"}
	<a
		id={ids?.root}
		{href}
		{target}
		{dir}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		aria-disabled={disabled || undefined}
		data-kind="card"
		data-slot="root"
		data-orientation={orientation}
		data-encoding={visual.encoding || undefined}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
	</a>
{:else if as === "button"}
	<button
		id={ids?.root}
		type="button"
		{disabled}
		{dir}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		data-kind="card"
		data-slot="root"
		data-orientation={orientation}
		data-encoding={visual.encoding || undefined}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
	</button>
{:else}
	<div
		id={ids?.root}
		{dir}
		role={label || labelledBy ? "group" : undefined}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		data-kind="card"
		data-slot="root"
		data-orientation={orientation}
		data-encoding={visual.encoding || undefined}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
