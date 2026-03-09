<!--
  @file Widget — Gold Standard Block Component
  @kind widget
  @layer blocks
  @package @devpulse/coldlight

  Compound block that composes header, tabs, content, and footer slots.
  Uses recipe from registry for STRUCTURAL slot classes.
  Uses useColdLight() for 8-axis VISUAL resolution on root.
  Renders with data-kind="widget" and data-slot per zone.

  Usage:
    <Widget title="Stats" preset="widget-stat">
      <p>Widget content here</p>
    </Widget>

    <Widget title="Chart" surface="glass-deep" depth="z2" glow="teal">
      <ChartContent />
    </Widget>
-->
<script lang="ts">
import type { WidgetProps } from "./types.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import WidgetHeader from "./WidgetHeader.svelte";
import WidgetTabs from "./WidgetTabs.svelte";
import WidgetContent from "./WidgetContent.svelte";
import WidgetFooter from "./WidgetFooter.svelte";

let {
	title,
	icon,
	size = "md",
	recipe: recipeId = "widget.glass.void",
	tabs,
	activeTab,
	onTabChange,
	children,
	actions,
	footer,
	class: className,
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
	radius = "lg",
}: WidgetProps = $props();

// ColdLight 8-axis resolution — visual treatment for root
const visual = useColdLight(
	() => ({
		preset: preset ?? "widget-stat",
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius, size,
	}),
);

// Recipe — structural slot classes only
const widgetRecipe = $derived(getRecipe(recipeId));
const slots = $derived(
	widgetRecipe?.classes?.({
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		size,
		radius: radius ?? "lg",
	}) ?? {},
);

const rootClasses = $derived(
	cn(slots.root, visual.segments, visual.radius, className),
);
</script>

<div
	data-kind="widget"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
>
	{#if title || icon || actions}
		<WidgetHeader
			{title}
			{icon}
			class={slots.header}
			titleClass={slots.title}
			actionsClass={slots.actions}
			{actions}
		/>
	{/if}

	{#if tabs && tabs.length > 0}
		<WidgetTabs
			{tabs}
			{activeTab}
			{onTabChange}
			class={slots.tabs}
			tabClass={slots.tab}
		/>
	{/if}

	<WidgetContent class={slots.content}>
		{@render children?.()}
	</WidgetContent>

	{#if footer}
		<WidgetFooter class={slots.footer}>
			{@render footer()}
		</WidgetFooter>
	{/if}
</div>
