<!--
  @file WidgetContent — Widget block content slot
  @kind widget
  @slot content
  @layer blocks
-->
<script lang="ts">
import type { WidgetContentProps } from "./types.js";

let {
	class: className = "widget-content",
	children,
}: WidgetContentProps = $props();
</script>

<div data-kind="widget" data-slot="content" class={className} role="tabpanel">
	{@render children?.()}
</div>
