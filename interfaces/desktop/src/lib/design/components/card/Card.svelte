<!--
	@component Card
	@kind card

	THE PRODUCT. StyleMacro (visual).
	Variant → style ID → DTCG tokens.
	Supports element polymorphism: div (default), a (link), button (clickable).
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
