<!--
	@component ComboboxContent — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Combobox content — the dropdown listbox popup container.
	MeltUI transport provides: role="listbox", aria-expanded, popover behavior,
	inert when closed, tabindex=-1, focus/blur handlers.

	ColdLight adds: data-kind, data-slot, data-state.

	APG: The listbox popup NEVER receives DOM focus. Options are highlighted
	via aria-activedescendant on the input. The content uses the native
	Popover API (popover="manual") managed by melt.

	Note: We render always (not {#if open}) because melt manages visibility
	via the popover API and the `inert` attribute when closed.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
	import type { ComboboxContentProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { comboboxRecipe } from "./recipe.js";

	let { children, class: className }: ComboboxContentProps = $props();

	const ctx = getComboboxContext();
	const recipe = comboboxRecipe();
</script>

<div
	{...ctx.slots.content}
	class={cn(recipe.content, className)}
	data-kind="combobox"
	data-slot="content"
	data-state={ctx.states.open ? "open" : "closed"}
>
	{@render children?.()}
</div>
