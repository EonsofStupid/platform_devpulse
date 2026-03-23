<!--
	@component NotificationCenter
	@kind notification-center
	@layer components

	ColdLight NotificationCenter — wraps structureless NotificationCenter primitive with:
	- ARIA attributes (role="log", aria-live="polite", aria-relevant="additions")
	- State derivation (data-state: open/closed)
	- SD5 token-driven composition
	- Keyboard: Escape to close

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
import { createNotificationCenter } from "$lib/design/api/dsadapters/coldlight/_internal/notification-center/index.js";
import NotificationCenterRoot from "$lib/design/primitives/notification-center/NotificationCenter.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { notificationCenterComposition } from "./composition.js";
import type { NotificationCenterComponentProps } from "./types.js";

let {
	// Kind-specific props
	open = false,
	onOpenChange,
	children,
	class: className,
	size,
	...rest
}: NotificationCenterComponentProps = $props();

const builder = createNotificationCenter({
	open: () => open,
		onOpenChange: (v: any) => onOpenChange?.(v),
});

// Resolve ColdLight visual
// Compose: structural composition + ColdLight visual + user classes
const classes = $derived(cn(notificationCenterComposition(), className));
</script>

<NotificationCenterRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</NotificationCenterRoot>
