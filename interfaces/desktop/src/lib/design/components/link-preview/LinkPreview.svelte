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
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useLinkPreview } from "$lib/design/primitives/link-preview/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { LinkPreviewProps } from "./types.js";
let { intent = "default", openDelay = 700, closeDelay = 300, open, onOpenChange, children, class: className }: LinkPreviewProps = $props();
const lp = $derived(useLinkPreview({ openDelay, closeDelay }));
const styleId = $derived(`link-preview-${intent}`);
</script>
<StyleMacro kind="link-preview" style={styleId}>
	<div data-kind="link-preview" data-slot="root" class={cn("relative inline-block", className)}>{@render children?.()}</div>
</StyleMacro>
