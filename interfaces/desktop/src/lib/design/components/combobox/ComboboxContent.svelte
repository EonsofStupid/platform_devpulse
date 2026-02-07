<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxComponentContext } from "./context.js";
import type { ComboboxContentProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxContentProps = $props();
const { transport, classes } = getComboboxComponentContext();
</script>

<div
	{...transport.slots.content}
	{...rest}
	data-kind="combobox"
	data-slot="content"
	data-state={transport.states.open ? "open" : "closed"}
	class={cn(classes.content, className)}
>
	{@render children?.()}
</div>
