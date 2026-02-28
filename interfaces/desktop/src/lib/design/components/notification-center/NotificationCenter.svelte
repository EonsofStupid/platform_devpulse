<!--
	@component NotificationCenter
	@kind notification-center
	@layer components

	ColdLight NotificationCenter — wraps structureless NotificationCenter primitive with:
	- ARIA attributes (role="log", aria-live="polite", aria-relevant="additions")
	- State derivation (data-state: open/closed)
	- SD5 token-driven recipe
	- Keyboard: Escape to close

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { NotificationCenterComponentProps } from "./types.js";
	import { createNotificationCenter } from "$lib/design/api/adapters/coldlight/_internal/notification-center/index.js";
	import NotificationCenterRoot from "$lib/design/primitives/notification-center/NotificationCenter.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { notificationCenterRecipe } from "./recipe.js";

	let {
		open = false,
		onOpenChange,
		children,
		class: className,
		...rest
	}: NotificationCenterComponentProps = $props();

	const builder = createNotificationCenter({
		open: () => open,
		onOpenChange: (v: any) => onOpenChange?.(v),
	});

	const classes = $derived(cn(notificationCenterRecipe(), className));
</script>

<NotificationCenterRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</NotificationCenterRoot>
