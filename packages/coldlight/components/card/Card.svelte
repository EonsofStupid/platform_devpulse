<!--
	@component Card
	@kind card
	@layer component
	@category structural
	@description Surface container for grouping related content with optional header and footer regions
	@container true
	@containerSlots header, body, footer
	@compound true
	@blockCategory layout
	@defaultStyle card-default
	@styleIds card-default, card-stark, card-glass, card-flat, card-matte
	@requiredAxes backgroundColor, shadow, border, borderRadius
	@slots root:all, header:none, body:none, footer:none
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
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { CARD_DEFAULTS } from "./card.generated.js";
import type { CardProps } from "./card.types.js";

let {
	as = "div",
	orientation = "vertical",
	variant = CARD_DEFAULTS.variant,
	surface,
	label,
	labelledBy,
	href,
	target,
	disabled = false,
	children,
	class: className,
	...rest
}: CardProps = $props();

// Layout only; the look is card.tokens.json's generated CSS, selected by these attributes.
const rootClasses = $derived(
	cn("flex overflow-hidden", orientation === "horizontal" ? "flex-row" : "flex-col", className),
);
const look = $derived(styleAttrs({ kind: "card", variant, surface }));
</script>

{#if as === "a"}
	<a
		{href}
		{target}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		aria-disabled={disabled || undefined}
		{...rest}
		{...look}
		data-slot="root"
		data-orientation={orientation}
		data-disabled={disabled || undefined}
		class={rootClasses}
	>
		{@render children?.()}
	</a>
{:else if as === "button"}
	<button
		type="button"
		{disabled}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		{...rest}
		{...look}
		data-slot="root"
		data-orientation={orientation}
		data-disabled={disabled || undefined}
		class={rootClasses}
	>
		{@render children?.()}
	</button>
{:else}
	<div
		role={label || labelledBy ? "group" : undefined}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		{...rest}
		{...look}
		data-slot="root"
		data-orientation={orientation}
		data-disabled={disabled || undefined}
		class={rootClasses}
	>
		{@render children?.()}
	</div>
{/if}
