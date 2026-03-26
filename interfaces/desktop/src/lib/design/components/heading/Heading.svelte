<!--
	@component Heading
	@kind heading
	@layer component
	@category content
	@description Semantic heading element for section titles with configurable level and visual size
	@container false
	@compound false
	@blockCategory content
	@defaultStyle heading-default
	@styleIds heading-default, heading-stark, heading-glass, heading-flat, heading-matte
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
import { useHeading } from "$lib/design/primitives/heading/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { HeadingProps, HeadingSize } from "./heading.types.js";

const SIZE: Record<HeadingSize, string> = {
	xs: "text-xs",
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
	xl: "text-xl",
	"2xl": "text-2xl",
	"3xl": "text-3xl",
};

let {
	intent = "default",
	level = 2,
	size = "lg",
	children,
	class: className,
	...rest
}: HeadingProps = $props();

const heading = $derived(useHeading({ level }));
</script>

<StyleMacro kind="heading" intent={intent}>
	{#if level === 1}
		<h1 {...heading.root} {...rest} class={cn("font-bold", SIZE[size] ?? SIZE.lg, className)}>
			{@render children?.()}
		</h1>
	{:else if level === 2}
		<h2 {...heading.root} {...rest} class={cn("font-bold", SIZE[size] ?? SIZE.lg, className)}>
			{@render children?.()}
		</h2>
	{:else if level === 3}
		<h3 {...heading.root} {...rest} class={cn("font-semibold", SIZE[size] ?? SIZE.lg, className)}>
			{@render children?.()}
		</h3>
	{:else if level === 4}
		<h4 {...heading.root} {...rest} class={cn("font-semibold", SIZE[size] ?? SIZE.lg, className)}>
			{@render children?.()}
		</h4>
	{:else if level === 5}
		<h5 {...heading.root} {...rest} class={cn("font-medium", SIZE[size] ?? SIZE.lg, className)}>
			{@render children?.()}
		</h5>
	{:else}
		<h6 {...heading.root} {...rest} class={cn("font-medium", SIZE[size] ?? SIZE.lg, className)}>
			{@render children?.()}
		</h6>
	{/if}
</StyleMacro>
