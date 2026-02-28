<!--
  @file WidgetTabs — Widget block chrome-style tab bar
  @kind widget
  @slot tabs
  @layer blocks
-->
<script lang="ts">
import type { WidgetTabsProps } from "./types.js";

let {
	tabs,
	activeTab,
	onTabChange,
	class: className = "widget-tabs",
	tabClass = "widget-tab",
}: WidgetTabsProps = $props();
</script>

<div data-kind="widget" data-slot="tabs" class={className} role="tablist">
	{#each tabs as tab (tab.id)}
		<button
			data-slot="tab"
			data-state={activeTab === tab.id ? "active" : "inactive"}
			class={tabClass}
			role="tab"
			aria-selected={activeTab === tab.id}
			onclick={() => onTabChange?.(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>
