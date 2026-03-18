<!--
  @file WidgetFooter — Widget block footer slot
  @kind widget
  @slot footer
  @layer blocks
-->
<script lang="ts">
import type { WidgetFooterProps } from "./types.js";

let { class: className = "widget-footer", children }: WidgetFooterProps = $props();
</script>

<div data-kind="widget" data-slot="footer" class={className}>
	{@render children?.()}
</div>
