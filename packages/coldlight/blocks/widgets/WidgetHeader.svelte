<!--
  @file WidgetHeader — Widget block header slot
  @kind widget
  @slot header
  @layer blocks

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
				{@const Icon = icon}
				<Icon class="size-icon-sm shrink-0 text-text-secondary" />
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
