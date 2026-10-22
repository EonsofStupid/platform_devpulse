<!--
  @file Widget — Dashboard Block
  @kind widget
  @layer blocks
  @package @devpulse/coldlight

  COMPOSITION of library components: Card (root), Heading (title), Tabs (tabs).
  Visual treatment is Card's: its family (`surface`) and role (`variant`).
  Block = composition of components. No duplicate markup. No hardcoded CSS.

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
import Card from "#coldlight/components/card/Card.svelte";
import Heading from "#coldlight/components/heading/Heading.svelte";
import Separator from "#coldlight/components/separator/Separator.svelte";
import { cn } from "#coldlight/utils/cn.js";
import type { WidgetProps } from "./types.js";
import WidgetContent from "./WidgetContent.svelte";
import WidgetFooter from "./WidgetFooter.svelte";
import WidgetTabs from "./WidgetTabs.svelte";

let {
	title,
	icon,
	size = "md",
	tabs,
	activeTab,
	onTabChange,
	children,
	actions,
	footer,
	class: className,
	// The look: Card's family and role.
	surface,
	variant,
	// Accepted, not drawn yet (see WidgetProps); held here so they stay off the DOM.
	depth,
	bevel,
	glow,
	frame,
	radius,
	...rest
}: WidgetProps = $props();
</script>

<Card
	{surface}
	{variant}
	class={cn("flex flex-col", className)}
	{...rest}
>
	{#if title || icon || actions}
		<div class="flex items-center justify-between px-4 pt-3 pb-2" data-slot="header">
			<div class="flex items-center gap-2">
				{#if icon}
					{@const Icon = icon}
					<Icon class="size-icon-sm text-[var(--color,var(--color-teal-400))]" />
				{/if}
				{#if title}
					<Heading level={3} size="sm" class="font-semibold">{title}</Heading>
				{/if}
			</div>
			{#if actions}
				<div class="flex items-center gap-1" data-slot="actions">
					{@render actions()}
				</div>
			{/if}
		</div>
	{/if}

	{#if tabs && tabs.length > 0}
		<WidgetTabs
			{tabs}
			{activeTab}
			{onTabChange}
		/>
	{/if}

	<WidgetContent>
		{@render children?.()}
	</WidgetContent>

	{#if footer}
		<Separator />
		<WidgetFooter>
			{@render footer()}
		</WidgetFooter>
	{/if}
</Card>
