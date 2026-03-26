<!--
	@component Toaster
	@kind toaster
	@layer component
	@category feedback
	@description Toast notification manager rendering transient messages in a stacked viewport region
	@container true
	@containerSlots root
	@compound true
	@blockCategory feedback
	@defaultStyle toaster-default
	@styleIds toaster-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, color, typography
	@slots root:all, toast:none, title:none, description:none, action:none, close:none
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
import { useToaster } from "$lib/design/primitives/toaster/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToasterComponentProps } from "./types.js";
let { position = "bottom-right", closeDelay = 5000, intent = "default", children, class: className, ...rest }: ToasterComponentProps = $props();
const toaster = $derived(useToaster({ position }));
</script>
<StyleMacro kind="toaster" intent={intent}>
	<div {...toaster.root} data-kind="toaster" data-slot="root" data-position={position} class={cn("fixed z-50 flex flex-col gap-2", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
