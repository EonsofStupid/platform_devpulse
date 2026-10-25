<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxComponentContext } from "./context.js";
import type { ComboboxGroupProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxGroupProps = $props();
const { classes } = getComboboxComponentContext();
</script>

<div
	{...rest}
	role="group"
	data-kind="combobox"
	data-slot="group"
	class={cn(classes.group, className)}
>
	{@render children?.()}
</div>
