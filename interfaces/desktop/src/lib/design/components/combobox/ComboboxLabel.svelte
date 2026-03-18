<!--
	@component ComboboxLabel — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Combobox label — associates a visible text label with the combobox input.
	MeltUI transport provides: `for` attribute linking to input ID.
	Clicking the label focuses the input.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxLabelProps } from "./types.js";

let { children, class: className }: ComboboxLabelProps = $props();

const ctx = getComboboxContext();
const { recipe } = ctx;
</script>

<label
	{...ctx.slots.label}
	class={cn(recipe.label, className)}
	data-kind="combobox"
	data-slot="label"
>
	{@render children?.()}
</label>
