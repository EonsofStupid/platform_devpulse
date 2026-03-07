<!--
  @file WidgetHeader — Widget block header slot
  @kind widget
  @slot header
  @layer blocks
-->
<script lang="ts">
import type { WidgetHeaderProps } from "./types.js";

let {
	title,
	icon,
	class: className = "widget-header",
	titleClass = "widget-title",
	actionsClass = "widget-actions",
	actions,
}: WidgetHeaderProps = $props();
</script>

<div data-kind="widget" data-slot="header" class={className}>
	{#if icon || title}
		<span data-slot="title" class="{titleClass} inline-flex items-center gap-1.5">
			{#if icon}
				<svelte:component this={icon} size={16} class="shrink-0 text-text-secondary" />
			{/if}
			{#if title}{title}{/if}
		</span>
	{/if}
	{#if actions}
		<div data-slot="actions" class={actionsClass}>
			{@render actions()}
		</div>
	{/if}
</div>
