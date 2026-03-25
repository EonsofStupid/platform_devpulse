<!--
	@component Text
	@kind text
	@layer component
	@category content
	@description Body text element with configurable size, weight, and semantic element
	@container false
	@compound false
	@blockCategory content
	@defaultStyle text-default
	@styleIds text-default, text-stark, text-glass, text-flat, text-matte
	@requiredAxes typography, color
	@slots root:all
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
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TextProps, TextSize, TextWeight } from "./text.types.js";

const SIZE: Record<TextSize, string> = {
	xs: "text-xs",
	sm: "text-sm",
	base: "text-base",
	lg: "text-lg",
	xl: "text-xl",
	"2xl": "text-2xl",
	"3xl": "text-3xl",
};

const WEIGHT: Record<TextWeight, string> = {
	light: "font-light",
	normal: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
	bold: "font-bold",
};

let {
	intent = "default",
	as = "span",
	size = "base",
	weight = "normal",
	children,
	class: className,
	...rest
}: TextProps = $props();

const styleId = $derived(`text-${intent}`);
const classes = $derived(cn(SIZE[size] ?? SIZE.base, WEIGHT[weight] ?? WEIGHT.normal, className));
</script>

<StyleMacro kind="text" style={styleId}>
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
	{:else if as === "div"}
		<div data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</div>
	{:else}
		<span data-kind="text" data-slot="root" {...rest} class={classes}>{@render children?.()}</span>
	{/if}
</StyleMacro>
