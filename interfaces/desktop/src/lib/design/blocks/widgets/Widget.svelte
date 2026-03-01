<!--
  @file Widget — Gold Standard Block Component
  @kind widget
  @layer blocks
  @package @devpulse/coldlight

  Compound block that composes header, tabs, content, and footer slots.
  Uses recipe from registry via getRecipe() for visual treatment.
  Renders with data-kind="widget" and data-slot per zone.

  Usage:
    <Widget title="Stats" tabs={[{id: "overview", label: "Overview"}]} activeTab="overview">
      <p>Widget content here</p>
    </Widget>
-->
<script lang="ts">
import type { WidgetProps } from "./types.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import WidgetHeader from "./WidgetHeader.svelte";
import WidgetTabs from "./WidgetTabs.svelte";
import WidgetContent from "./WidgetContent.svelte";
import WidgetFooter from "./WidgetFooter.svelte";

let {
	title,
	size = "md",
	recipe: recipeId = "widget.glass.void",
	tabs,
	activeTab,
	onTabChange,
	children,
	actions,
	footer,
	class: className,
}: WidgetProps = $props();

const widgetRecipe = $derived(getRecipe(recipeId));
const slots = $derived(
	widgetRecipe?.classes({
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		size,
		radius: "lg",
	}) ?? {},
);
</script>

<div data-kind="widget" data-slot="root" class={cn(slots.root, className)}>
	{#if title || actions}
		<WidgetHeader
			{title}
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
