<script lang="ts">
	import type { DialogDescriptionProps } from "./types.js";
	import { getDialogComponentContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className, ...rest }: DialogDescriptionProps = $props();
	const { transport, classes } = getDialogComponentContext();
</script>

<p
	{...transport.slots.description}
	{...rest}
	data-kind="dialog"
	data-slot="description"
	class={cn(classes.description, className)}
>
	{@render children?.()}
</p>
