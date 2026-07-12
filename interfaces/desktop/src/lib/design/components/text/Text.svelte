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
		"background-color": "transparent",
		"box-shadow": "none",
		"border-width": "0",
		"color": "oklch(0.9319 0.015 224)"
}
-->
<script lang="ts">
import { textAnatomy } from "$lib/design/behaviors/display/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
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
	preset = "default",
	as = "span",
	size = "base",
	weight = "normal",
	children,
	class: className,
	...rest
}: TextProps = $props();

const classes = $derived(cn(SIZE[size] ?? SIZE.base, WEIGHT[weight] ?? WEIGHT.normal, className));
const m = $derived(renderForge({ kind: "text", preset }));
</script>

{#if as === "p"}
		<p {...textAnatomy.attrs.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={classes}>{@render children?.()}</p>
	{:else if as === "label"}
		<label {...textAnatomy.attrs.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={classes}>{@render children?.()}</label>
	{:else if as === "em"}
		<em {...textAnatomy.attrs.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={classes}>{@render children?.()}</em>
	{:else if as === "strong"}
		<strong {...textAnatomy.attrs.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={classes}>{@render children?.()}</strong>
	{:else if as === "small"}
		<small {...textAnatomy.attrs.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={classes}>{@render children?.()}</small>
	{:else if as === "div"}
		<div {...textAnatomy.attrs.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={classes}>{@render children?.()}</div>
	{:else}
		<span {...textAnatomy.attrs.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={classes}>{@render children?.()}</span>
	{/if}
