<!--
	@component Table of Contents
	@kind table-of-contents
	@layer component
	@category content
	@description Auto-generated navigation list of page headings with scroll-spy active state tracking
	@container false
	@compound true
	@blockCategory navigation
	@defaultStyle table-of-contents-default
	@styleIds table-of-contents-default
	@requiredAxes border, color, typography
	@slots root:all, item:none, link:none, indicator:none
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
import { useTableOfContents } from "$lib/design/primitives/table-of-contents/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TableOfContentsComponentProps } from "./types.js";
let { label = "Table of contents", activeId, onActiveIdChange, size = "md", intent = "default", children, class: className, ...rest }: TableOfContentsComponentProps = $props();
const toc = $derived(useTableOfContents({ label }));
</script>
<StyleMacro kind="table-of-contents" intent={intent}>
	<nav {...toc.root} data-kind="table-of-contents" data-slot="root" class={cn("flex flex-col", className)} {...rest}>{@render children?.()}</nav>
</StyleMacro>
