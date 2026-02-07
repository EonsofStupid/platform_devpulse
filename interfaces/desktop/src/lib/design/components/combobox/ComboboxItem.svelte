<script lang="ts" generics="T">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxComponentContext } from "./context.js";
import type { ComboboxItemProps } from "./types.js";

let { value, label, children, class: className, ...rest }: ComboboxItemProps<T> = $props();
const { transport, classes } = getComboboxComponentContext<T>();
</script>

<div
	{...transport.getOption(value, label)}
	{...rest}
	data-kind="combobox"
	data-slot="item"
	class={cn(classes.item, className)}
>
	{@render children?.()}
</div>
