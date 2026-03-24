<!--
  @file Widget — Dashboard Block
  @kind widget
  @layer blocks
  @package @devpulse/coldlight

  COMPOSITION of library components: Card (root), Heading (title), Tabs (tabs).
  Visual treatment flows through Card → StyleMacro → preset pipeline.
  Block = composition of components. No duplicate markup. No hardcoded CSS.
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

// Card variant resolves to a style preset ID
// If preset is provided, use it directly. Otherwise use card-default.
const cardVariant = $derived(preset ?? "default");
</script>

<Card
	variant={cardVariant}
	class={cn("flex flex-col", className)}
	{...rest}
>
	{#if title || icon || actions}
		<div class="flex items-center justify-between px-4 pt-3 pb-2" data-slot="header">
			<div class="flex items-center gap-2">
				{#if icon}
					<svelte:component this={icon} size={16} class="text-[var(--cl-color,var(--color-teal-400))]" />
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
