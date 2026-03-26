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
import { useToggleGroup } from "$lib/design/behaviors/toggle-group/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToggleGroupComponentProps } from "./types.js";
let { size = "md", value, onValueChange, multiple = false, disabled = false, orientation = "horizontal", loop = true, intent = "default", children, class: className, ...rest }: ToggleGroupComponentProps = $props();
const tg = $derived(useToggleGroup({ disabled, orientation }));
</script>
<StyleMacro kind="toggle-group" intent={intent}>
	<div {...tg.root as any} data-kind="toggle-group" data-slot="root" data-orientation={orientation} class={cn("inline-flex items-center rounded-md", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
