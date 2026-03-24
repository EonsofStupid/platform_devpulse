<!--
	@component LinkPreview
	@kind link-preview
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useLinkPreview } from "$lib/design/primitives/link-preview/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { LinkPreviewProps } from "./types.js";
let { openDelay = 700, closeDelay = 300, open, onOpenChange, children, class: className }: LinkPreviewProps = $props();
const lp = $derived(useLinkPreview({ openDelay, closeDelay }));
const styleId = "link-preview-default";
</script>
<StyleMacro kind="link-preview" style={styleId}>
	<div data-kind="link-preview" data-slot="root" class={cn("relative inline-block", className)}>{@render children?.()}</div>
</StyleMacro>
