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
	@styleIds text-default
	@requiredAxes typography, color
	@slots root:all
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
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
	as = "span",
	size = "base",
	weight = "normal",
	children,
	class: className,
	...rest
}: TextProps = $props();

const styleId = "text-default";
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
