<!--
	@component LinkPreview
	@kind link-preview
	@layer components

	ColdLight LinkPreview — compound component root.
	Tooltip-like hover preview for links.
	Sub-components (LinkPreviewTrigger, LinkPreviewContent) consume context
	to access their slot attributes.

	ColdLight adds data-kind, data-slot, ColdLight 8-axis visual.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { LinkPreviewProps } from "./types.js";

let {
	openDelay = 700,
	closeDelay = 300,
	open,
	onOpenChange,
	children,
	class: className,
	size,
}: LinkPreviewProps = $props();

</script>

<div
	class={cn( className)}
	data-kind="link-preview"
	data-slot="root"
>
	{@render children?.()}
</div>
