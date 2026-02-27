<!--
	@component ComboboxInput — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Combobox text input — role="combobox".
	MeltUI transport provides: aria-expanded, aria-controls, aria-activedescendant,
	keyboard handlers (ArrowUp/Down, Enter, Escape, Home, End), focus management.

	ColdLight adds: data-kind, data-slot, data-state, WAI-Adapt, ARIA 1.3.

	APG: The input is the primary interactive element. Focus STAYS here.
	Options are highlighted via aria-activedescendant, not DOM focus.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
	import type { ComboboxInputProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		class: className,
		placeholder,
		"adapt-purpose": adaptPurpose,
		"aria-description": ariaDescription,
	}: ComboboxInputProps = $props();

	const ctx = getComboboxContext();
	const { recipe } = ctx;
</script>

<input
	{...ctx.slots.input}
	class={cn(recipe.input, className)}
	data-kind="combobox"
	data-slot="input"
	data-state={ctx.states.open ? "open" : "closed"}
	data-adapt-action="filter"
	data-adapt-purpose={adaptPurpose ?? "search-term"}
	{...ariaDescription ? {"aria-description": ariaDescription} : {}}
	{placeholder}
/>
