<!--
	@component ComboboxTrigger — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Combobox toggle trigger button — opens/closes the listbox dropdown.
	MeltUI transport provides: onclick toggle, keyboard handlers.

	ColdLight adds: data-kind, data-slot, data-state, WAI-Adapt.

	APG: The trigger is a supplementary control. It toggles the popup
	but does NOT receive focus during keyboard navigation of options.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxTriggerProps } from "./types.js";

let {
	children,
	class: className,
	"aria-label": ariaLabel = "Toggle options",
}: ComboboxTriggerProps = $props();

const ctx = getComboboxContext();
const { recipe } = ctx;
</script>

<button
	{...ctx.slots.trigger}
	class={cn(recipe.trigger, className)}
	data-kind="combobox"
	data-slot="trigger"
	data-state={ctx.states.open ? "open" : "closed"}
	data-adapt-action="open-listbox"
	aria-label={ariaLabel}
>
	{@render children?.()}
</button>
