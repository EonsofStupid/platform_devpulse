<!--
	@component ComboboxGroup — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Combobox option group — role="group" with aria-labelledby.
	Groups related options under a visible label heading.

	Usage:
	```svelte
	<ComboboxGroup label="Fruits">
		<ComboboxItem value="apple">Apple</ComboboxItem>
		<ComboboxItem value="banana">Banana</ComboboxItem>
	</ComboboxGroup>
	```

	The group label is rendered as a div with a generated ID.
	aria-labelledby on the group element references this label ID.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxGroupProps } from "./types.js";

let { label, children, class: className }: ComboboxGroupProps = $props();

const { recipe } = getComboboxContext();
const labelId = `cl-combobox-group-${crypto.randomUUID().slice(0, 8)}`;
</script>

<div
	role="group"
	aria-labelledby={labelId}
	class={cn(recipe.group, className)}
	data-kind="combobox"
	data-slot="group"
>
	<div
		id={labelId}
		class={recipe.groupLabel}
		data-kind="combobox"
		data-slot="group-label"
	>
		{label}
	</div>
	{@render children?.()}
</div>
