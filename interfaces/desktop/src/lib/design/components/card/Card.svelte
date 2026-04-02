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
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { CardProps } from "./card.types.js";

let {
	as = "div",
	orientation = "vertical",
	variant = "default",
	preset = "default",
	label,
	labelledBy,
	href,
	target,
	disabled = false,
	children,
	class: className,
	...rest
}: CardProps = $props();

const rootClasses = $derived(
	cn(
		"flex overflow-hidden",
		orientation === "horizontal" ? "flex-row" : "flex-col",
		disabled && "pointer-events-none opacity-60",
		className,
	),
);

const m = $derived(renderForge({ kind: "card", preset }));
</script>

{#if as === "a"}
	<a
		{href}
		{target}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		aria-disabled={disabled || undefined}
		{...m.dataAttrs}
		data-slot="root"
		data-orientation={orientation}
		style={cssVarString(m.cssVars)}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
	</a>
{:else if as === "button"}
	<button
		type="button"
		{disabled}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		{...m.dataAttrs}
		data-slot="root"
		data-orientation={orientation}
		style={cssVarString(m.cssVars)}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
	</button>
{:else}
	<div
		role={label || labelledBy ? "group" : undefined}
		aria-label={label || undefined}
		aria-labelledby={labelledBy || undefined}
		{...m.dataAttrs}
		data-slot="root"
		data-orientation={orientation}
		style={cssVarString(m.cssVars)}
		class={rootClasses}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
