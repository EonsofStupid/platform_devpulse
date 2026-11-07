<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDialogComponentContext } from "./context.js";
import type { DialogTitleProps } from "./types.js";

let { children, class: className, ...rest }: DialogTitleProps = $props();
const { transport, classes } = getDialogComponentContext();
</script>

<h2
	{...transport.slots.title}
	{...rest}
	data-kind="dialog"
	data-slot="title"
	class={cn(classes.title, className)}
>
	{@render children?.()}
</h2>
