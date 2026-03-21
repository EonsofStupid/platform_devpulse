<!--
  @file Widget — Gold Standard Block Component
  @kind widget
  @layer blocks
  @package @devpulse/coldlight

  DUMB block. Compound structure: header, tabs, content, footer.
  Visual treatment via class prop from caller (StyleMacro or v-* utilities).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { WidgetProps } from "./types.js";
import WidgetContent from "./WidgetContent.svelte";
import WidgetFooter from "./WidgetFooter.svelte";
import WidgetHeader from "./WidgetHeader.svelte";
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
}: WidgetProps = $props();

const rootClasses = $derived(cn(
	"flex flex-col overflow-hidden rounded-lg",
	"border border-border-subtle",
	"bg-[var(--surface-elevated)]",
	className,
));
</script>

<div
	data-kind="widget"
	data-slot="root"
	class={rootClasses}
>
	{#if title || icon || actions}
		<WidgetHeader
			{title}
			{icon}
			{actions}
		/>
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
		<WidgetFooter>
			{@render footer()}
		</WidgetFooter>
	{/if}
</div>
