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
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useDescriptionList } from "$lib/design/primitives/description-list/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DescriptionListComponentProps } from "./types.js";
let { size = "md", variant = "default", intent = "default", label, children, class: className, ...rest }: DescriptionListComponentProps = $props();
const dl = $derived(useDescriptionList({ label }));
const styleId = $derived(`description-list-${intent}`);
</script>
<StyleMacro kind="description-list" style={styleId}>
	<dl {...dl.root} data-kind="description-list" data-slot="root" data-variant={variant} class={cn(className)} {...rest}>{@render children?.()}</dl>
</StyleMacro>
