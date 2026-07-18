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
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { toasterAnatomy, useToaster } from "$lib/design/behaviors/overlays/toaster/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToasterComponentProps } from "./types.js";

let {
	position = "bottom-right",
	closeDelay = 5000,
	preset = "default",
	children,
	class: className,
	...rest
}: ToasterComponentProps = $props();
const toaster = $derived(useToaster({ position }));
const m = $derived(renderForge({ kind: "toaster", preset }));
</script>
<div {...toasterAnatomy.attrs.root} {...toaster.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} data-position={position} class={cn("fixed z-50 flex flex-col gap-2", className)} {...rest}>{@render children?.()}</div>
