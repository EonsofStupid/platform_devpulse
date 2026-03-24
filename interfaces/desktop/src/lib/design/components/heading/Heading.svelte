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
	@styleIds heading-default
	@requiredAxes typography, color
	@slots root:all
-->
<script lang="ts">
import { useHeading } from "$lib/design/primitives/heading/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
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
	level = 2,
	size = "lg",
	children,
	class: className,
	...rest
}: HeadingProps = $props();

const heading = $derived(useHeading({ level }));
const styleId = "heading-default";
</script>

<StyleMacro kind="heading" style={styleId}>
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
