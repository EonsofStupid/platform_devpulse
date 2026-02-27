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
	import type { ComboboxLabelProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { children, class: className }: ComboboxLabelProps = $props();

	const ctx = getComboboxContext();
	const recipe = comboboxRecipe();
</script>

<label
	{...ctx.slots.label}
	class={cn(recipe.label, className)}
	data-kind="combobox"
	data-slot="label"
>
	{@render children?.()}
</label>
