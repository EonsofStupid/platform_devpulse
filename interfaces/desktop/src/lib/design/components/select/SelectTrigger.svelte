<!--
	@component SelectTrigger
	@kind select
	@layer components

	Select trigger button — opens/closes the listbox.
	MeltUI transport provides aria-expanded, aria-haspopup, keyboard handlers.

	WAI-ARIA APG: trigger has role="combobox", aria-expanded, aria-haspopup.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSelectContext } from "./context.js";
import { selectComposition } from "./composition.js";
import type { SelectTriggerProps } from "./types.js";

let { children, class: className, ...rest }: SelectTriggerProps = $props();

const transport = getSelectContext();
const composition = selectComposition();
</script>

<button
	{...transport.slots.trigger}
	class={cn(composition.trigger, className)}
	data-kind="select"
	data-slot="trigger"
	data-state={transport.states.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</button>
