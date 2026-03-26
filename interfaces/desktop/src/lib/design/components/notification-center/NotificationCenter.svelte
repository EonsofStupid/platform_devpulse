<!--
	@component Notification Center
	@kind notification-center
	@layer component
	@category feedback
	@description Aggregated notification panel displaying a scrollable list of alerts and messages
	@container true
	@containerSlots root
	@compound true
	@blockCategory feedback
	@defaultStyle notification-center-default
	@styleIds notification-center-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, color, typography
	@slots root:all, header:none, list:none, item:none, empty:none
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
import { useNotificationCenter } from "$lib/design/primitives/notification-center/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { NotificationCenterComponentProps } from "./types.js";
let { open = false, onOpenChange, intent = "default", children, class: className, ...rest }: NotificationCenterComponentProps = $props();
const nc = $derived(useNotificationCenter({ open }));
</script>
<StyleMacro kind="notification-center" intent={intent}>
	<div {...nc.root} data-kind="notification-center" data-slot="root" data-state={open ? "open" : "closed"} class={cn("fixed z-50 flex flex-col gap-2", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
