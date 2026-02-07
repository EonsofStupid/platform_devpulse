<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxComponentContext } from "./context.js";
import type { ComboboxInputProps } from "./types.js";

let { class: className, ...rest }: ComboboxInputProps = $props();
const { transport, classes } = getComboboxComponentContext();
</script>

<input
	{...transport.slots.input}
	{...rest}
	data-kind="combobox"
	data-slot="input"
	class={cn(classes.input, className)}
/>
