<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxComponentContext } from "./context.js";
import type { ComboboxLabelProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxLabelProps = $props();
const { transport, classes } = getComboboxComponentContext();
</script>

<label
	{...transport.slots.label}
	{...rest}
	data-kind="combobox"
	data-slot="label"
	class={cn(classes.label, className)}
>
	{@render children?.()}
</label>
