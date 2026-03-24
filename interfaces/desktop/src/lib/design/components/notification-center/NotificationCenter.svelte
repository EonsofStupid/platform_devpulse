<!--
	@component NotificationCenter
	@kind notification-center
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useNotificationCenter } from "$lib/design/primitives/notification-center/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { NotificationCenterComponentProps } from "./types.js";
let { open = false, onOpenChange, children, class: className, ...rest }: NotificationCenterComponentProps = $props();
const nc = $derived(useNotificationCenter({ open }));
const styleId = "notification-center-default";
</script>
<StyleMacro kind="notification-center" style={styleId}>
	<div {...nc.root} data-kind="notification-center" data-slot="root" data-state={open ? "open" : "closed"} class={cn("fixed z-50 flex flex-col gap-2", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
