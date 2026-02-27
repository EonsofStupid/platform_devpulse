<!--
	@component ComboboxEmpty — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Combobox empty state — shown when no items match the input filter.
	Has role="status" with aria-live="polite" so screen readers announce
	the "no results" message when filtering produces zero matches.

	This is a live region per the contract's liveRegions declaration.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
	import type { ComboboxEmptyProps } from "./types.js";
	import { getComboboxContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let { children, class: className }: ComboboxEmptyProps = $props();

	const { recipe } = getComboboxContext();
</script>

<div
	role="status"
	aria-live="polite"
	aria-atomic="true"
	class={cn(recipe.empty, className)}
	data-kind="combobox"
	data-slot="empty"
>
	{@render children?.()}
</div>
