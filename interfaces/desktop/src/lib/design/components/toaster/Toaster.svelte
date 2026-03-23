<!--
	@component Toaster
	@kind toaster
	@layer components

	ColdLight Toaster — wraps MeltUI toaster transport with:
	- ARIA attributes (role="region", aria-label via transport)
	- ColdLight 8-axis visual system
	- SD5 token-driven composition

	ColdLight OWNS all ARIA. MeltUI transport handles toast lifecycle.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { ToasterComponentProps } from "./types.js";

let {
	// Kind-specific props
	position = "bottom-right",
	closeDelay = 5000,
	children,
	class: className,
	size,
	...rest
}: ToasterComponentProps = $props();

// Resolve ColdLight visual
// Compose: ColdLight visual + user classes
const classes = $derived(cn( className));
</script>

<div
	{...rest}
	class={classes}
	data-kind="toaster"
	data-slot="root"
	data-position={position}
	aria-label="Notifications"
	role="region"
>
	{@render children?.()}
</div>
