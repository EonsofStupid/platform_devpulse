<!--
	@component NotificationCenter
	@file primitives/notification-center/NotificationCenter.svelte
	@kind notification-center
	@layer primitives
	@package @devpulse/coldlight

	Notification list panel primitive — semantic HTML element with data attributes only.
	Contract: kind="notification-center", slot="root"

	Zero ARIA. Zero behavior. Zero styling.
	- ARIA applied by:    components/notification-center/NotificationCenter.svelte
	- Styling applied by: recipe class string from component layer
	- Contract declared:  primitives/notification-center/contract.ts
-->
<script lang="ts">
	import type { NotificationCenterProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: NotificationCenterProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "NotificationCenter");
</script>

<div data-kind="notification-center" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
