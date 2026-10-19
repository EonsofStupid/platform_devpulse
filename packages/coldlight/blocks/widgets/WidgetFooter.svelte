<!--
  @file WidgetFooter — Widget block footer slot
  @kind widget
  @slot footer
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
import type { WidgetFooterProps } from "./types.js";

let { class: className = "widget-footer", children }: WidgetFooterProps = $props();
</script>

<div data-kind="widget" data-slot="footer" class={className}>
	{@render children?.()}
</div>
