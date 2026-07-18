<!--
	@component Link Preview
	@kind link-preview
	@layer component
	@category interactive
	@description Hover or focus-triggered popover showing a rich preview of a linked resource
	@container false
	@compound true
	@blockCategory content
	@defaultStyle link-preview-default
	@styleIds link-preview-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, typography, color
	@slots root:all, trigger:none, content:none, image:none, title:none, description:none
	@defaults {
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useLinkPreview } from "$lib/design/behaviors/navigation/link-preview/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { LinkPreviewProps } from "./types.js";

let {
	preset = "default",
	openDelay = 700,
	closeDelay = 300,
	open,
	onOpenChange,
	children,
	class: className,
}: LinkPreviewProps = $props();
const lp = $derived(useLinkPreview({ openDelay, closeDelay }));
const m = $derived(renderForge({ kind: "link-preview", preset }));
</script>
<div {...m.dataAttrs} style={cssVarString(m.cssVars)} data-slot="root" class={cn("relative inline-block", className)}>{@render children?.()}</div>
