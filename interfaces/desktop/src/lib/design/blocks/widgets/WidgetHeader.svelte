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
	class: className = "widget-header",
	titleClass = "widget-title",
	actionsClass = "widget-actions",
	actions,
}: WidgetHeaderProps = $props();
</script>

<div data-kind="widget" data-slot="header" class={className}>
	{#if title}
		<span data-slot="title" class={titleClass}>{title}</span>
	{/if}
	{#if actions}
		<div data-slot="actions" class={actionsClass}>
			{@render actions()}
		</div>
	{/if}
</div>
