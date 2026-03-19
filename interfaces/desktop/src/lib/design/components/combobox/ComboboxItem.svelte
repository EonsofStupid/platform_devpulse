<!--
	@component ComboboxItem — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Individual combobox option — role="option", aria-selected.
	MeltUI transport provides ARIA attributes via ctx.getOption(value, label):
	- role="option", aria-selected, data-highlighted, tabindex=-1
	- onclick handler for selection
	- onmouseover handler for highlight tracking

	ColdLight adds: data-kind, data-slot, data-state, WAI-Adapt, ARIA 1.3.

	ARIA 1.3: aria-description provides supplementary context per option
	(e.g., "Recently used" or "Premium feature — requires upgrade").

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxItemProps } from "./types.js";

let {
	value,
	label,
	disabled,
	children,
	class: className,
	"aria-description": ariaDescription,
}: ComboboxItemProps = $props();

const ctx = getComboboxContext();
const { recipe } = ctx;

const isSelected = $derived(ctx.isSelected(value));
</script>

<div
	{...ctx.getOption(value, label)}
	class={cn(recipe.item, className)}
	data-kind="combobox"
	data-slot="option"
	data-state={isSelected ? "selected" : undefined}
	data-adapt-action="select"
	aria-disabled={disabled ? "true" : undefined}
	{...ariaDescription ? {"aria-description": ariaDescription} : {}}
>
	{@render children?.()}
</div>
