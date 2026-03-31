<!--
  @file Widget — Dashboard Block
  @kind widget
  @layer blocks
  @package @devpulse/coldlight

  COMPOSITION of library components: Card (root), Heading (title), Tabs (tabs).
  Visual treatment flows through Card → StyleMacro → preset pipeline.
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
import Card from "$lib/design/components/card/Card.svelte";
import Heading from "$lib/design/components/heading/Heading.svelte";
import Separator from "$lib/design/components/separator/Separator.svelte";
import { cn } from "$lib/design/utils/cn.js";
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
	intent = "default",
	// Visual axis props — forwarded to Card
	surface,
	depth,
	bevel,
	glow,
	frame,
	radius,
	preset,
	...rest
}: WidgetProps = $props();

// Intent flows through to Card's StyleMacro
const resolvedIntent = $derived(
	(preset ?? intent ?? "default") as import("$lib/design/components/card/card.types.js").CardPreset,
);
</script>

<Card
	preset={resolvedIntent}
	class={cn("flex flex-col", className)}
	{...rest}
>
	{#if title || icon || actions}
		<div class="flex items-center justify-between px-4 pt-3 pb-2" data-slot="header">
			<div class="flex items-center gap-2">
				{#if icon}
					{@const Icon = icon}
					<Icon size={16} class="text-[var(--color,var(--color-teal-400))]" />
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
