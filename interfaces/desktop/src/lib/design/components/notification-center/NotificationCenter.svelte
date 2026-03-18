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
import { createNotificationCenter } from "$lib/design/api/dsadapters/coldlight/_internal/notification-center/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import NotificationCenterRoot from "$lib/design/primitives/notification-center/NotificationCenter.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { notificationCenterRecipe } from "./recipe.js";
import type { NotificationCenterComponentProps } from "./types.js";

let {
	// Kind-specific props
	open = false,
	onOpenChange,
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
	// Rest spread
	...rest
}: NotificationCenterComponentProps = $props();

const builder = createNotificationCenter({
	open: () => open,
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from builder
	onOpenChange: (v: any) => onOpenChange?.(v),
});

// Resolve ColdLight visual
const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

// Compose: structural recipe + ColdLight visual + user classes
const classes = $derived(cn(notificationCenterRecipe(), visual.segments, visual.radius, className));
</script>

<NotificationCenterRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</NotificationCenterRoot>
