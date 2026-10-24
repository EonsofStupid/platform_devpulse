<!--
	@component Combobox.Group
	@kind combobox
	@slot group
	@layer components

	Groups related options under a visible label heading.
	role="group" with aria-labelledby.
-->
<script lang="ts">
import { uid } from "#coldlight/behaviors/_internal/utils/uid.js";
import { cn } from "#coldlight/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxGroupProps } from "./types.js";

let { label, children, class: className }: ComboboxGroupProps = $props();
const ctx = getComboboxContext();
const labelId = uid("combobox-group");
</script>

<div
	role="group"
	aria-labelledby={labelId}
	class={cn(className)}
	data-kind="combobox"
	data-slot="group"
>
	<div
		id={labelId}
		class=""
		data-kind="combobox"
		data-slot="group-label"
	>
		{label}
	</div>
	{@render children?.()}
</div>
