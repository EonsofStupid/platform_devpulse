<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxComponentContext } from "./context.js";
import type { ComboboxTriggerProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxTriggerProps = $props();
const { transport, classes } = getComboboxComponentContext();
</script>

<button
	{...transport.slots.trigger}
	{...rest}
	data-kind="combobox"
	data-slot="trigger"
	class={cn(classes.trigger, className)}
>
	{@render children?.()}
</button>
