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
-->
<script lang="ts">
import { useDescriptionList } from "$lib/design/primitives/description-list/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DescriptionListComponentProps } from "./types.js";
let { size = "md", variant = "default", label, children, class: className, ...rest }: DescriptionListComponentProps = $props();
const dl = $derived(useDescriptionList({ label }));
const styleId = "description-list-default";
</script>
<StyleMacro kind="description-list" style={styleId}>
	<dl {...dl.root} data-kind="description-list" data-slot="root" data-variant={variant} class={cn(className)} {...rest}>{@render children?.()}</dl>
</StyleMacro>
