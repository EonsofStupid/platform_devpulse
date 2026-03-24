<!--
	@component Toggle Group
	@kind toggle-group
	@layer component
	@category interactive
	@description Set of toggle buttons allowing single or multiple selection within a group
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle toggle-group-default
	@styleIds toggle-group-default
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, item:none
-->
<script lang="ts">
import { useToggleGroup } from "$lib/design/primitives/toggle-group/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToggleGroupComponentProps } from "./types.js";
let { size = "md", value, onValueChange, multiple = false, disabled = false, orientation = "horizontal", loop = true, children, class: className, ...rest }: ToggleGroupComponentProps = $props();
const tg = $derived(useToggleGroup({ disabled, orientation }));
const styleId = "toggle-group-default";
</script>
<StyleMacro kind="toggle-group" style={styleId}>
	<div {...tg.root} data-kind="toggle-group" data-slot="root" data-orientation={orientation} class={cn("inline-flex items-center rounded-md", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
