<script lang="ts">
	import type { DialogOverlayProps } from "./types.js";
	import { getDialogComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: DialogOverlayProps = $props();
	const { transport, classes } = getDialogComponentContext();
</script>

<div
	{...transport.slots.overlay}
	{...rest}
	data-kind="dialog"
	data-slot="overlay"
	data-state={transport.states.open ? "open" : "closed"}
	class={cn(classes.overlay, className)}
	use:transport.attachOverlay
>
	{@render children?.()}
</div>
