<script lang="ts">
	import type { DialogContentProps } from "./types.js";
	import { getDialogComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: DialogContentProps = $props();
	const { transport, classes } = getDialogComponentContext();
</script>

<dialog
	{...transport.slots.content}
	{...rest}
	data-kind="dialog"
	data-slot="content"
	data-state={transport.states.open ? "open" : "closed"}
	class={cn(classes.content, className)}
	use:transport.attachContent
>
	{@render children?.()}
</dialog>
