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
	@styleIds card-default, card-outlined, card-elevated, card-ghost, card-glow
	@requiredAxes backgroundColor, shadow, border, borderRadius
	@slots root:all, header:none, body:none, footer:none
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { CardProps } from "./card.types.js";

let {
	as = "div",
	orientation = "vertical",
	variant = "default",
	label,
	labelledBy,
	href,
	target,
	disabled = false,
	children,
	class: className,
	...rest
}: CardProps = $props();

const styleId = $derived(`card-${variant}`);

const rootClasses = $derived(cn(
	"flex overflow-hidden",
	orientation === "horizontal" ? "flex-row" : "flex-col",
	disabled && "pointer-events-none opacity-60",
	className));
</script>

<StyleMacro kind="card" style={styleId}>
	{#if as === "a"}
		<a
			{href}
			{target}
			aria-label={label || undefined}
			aria-labelledby={labelledBy || undefined}
			aria-disabled={disabled || undefined}
			data-kind="card"
			data-slot="root"
			data-orientation={orientation}
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
			data-kind="card"
			data-slot="root"
			data-orientation={orientation}
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
			data-kind="card"
			data-slot="root"
			data-orientation={orientation}
			class={rootClasses}
			{...rest}
		>
			{@render children?.()}
		</div>
	{/if}
</StyleMacro>
