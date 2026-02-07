<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxComponentContext } from "./context.js";
import type { ComboboxEmptyProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxEmptyProps = $props();
const { classes } = getComboboxComponentContext();
</script>

<div
	{...rest}
	data-kind="combobox"
	data-slot="empty"
	class={cn(classes.empty, className)}
>
	{@render children?.()}
</div>
