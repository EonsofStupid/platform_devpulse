<!--
	@component Description List
	@kind description-list
	@layer component
	@category content
	@description Key-value pair list for displaying metadata, definitions, or attribute summaries
	@container true
	@containerSlots root
	@compound true
	@blockCategory content
	@defaultStyle description-list-default
	@styleIds description-list-default
	@requiredAxes typography, color, border
	@slots root:all, term:none, detail:none
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
	descriptionListAnatomy,
	useDescriptionList,
} from "$lib/design/behaviors/display/description-list/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DescriptionListProps } from "./types.js";

let {
	size = "md",
	variant = "default",
	preset = "default",
	label,
	children,
	class: className,
	...rest
}: DescriptionListProps = $props();
const dl = $derived(useDescriptionList({ label }));
const m = $derived(renderForge({ kind: "description-list", preset }));
</script>
<dl {...descriptionListAnatomy.attrs.root} {...dl.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} data-variant={variant} class={cn(className)} {...rest}>{@render children?.()}</dl>
