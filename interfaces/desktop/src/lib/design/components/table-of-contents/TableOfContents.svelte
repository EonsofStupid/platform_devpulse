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
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import {
	tableOfContentsAnatomy,
	useTableOfContents,
} from "$lib/design/behaviors/navigation/table-of-contents/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TableOfContentsProps } from "./types.js";

let {
	label = "Table of contents",
	activeId,
	onActiveIdChange,
	size = "md",
	preset = "default",
	children,
	class: className,
	...rest
}: TableOfContentsProps = $props();
const toc = $derived(useTableOfContents({ label }));
const m = $derived(renderForge({ kind: "table-of-contents", preset }));
</script>
<nav {...tableOfContentsAnatomy.attrs.root} {...toc.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={cn("flex flex-col", className)} {...rest}>{@render children?.()}</nav>
