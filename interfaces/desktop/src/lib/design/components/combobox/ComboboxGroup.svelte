<!--
	@component Combobox.Group
	@kind combobox
	@slot group
	@layer components

	Groups related options under a visible label heading.
	role="group" with aria-labelledby.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { uid } from "$lib/design/_internal/utils/uid.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxGroupProps } from "./types.js";

let { label, children, class: className }: ComboboxGroupProps = $props();
const ctx = getComboboxContext();
const labelId = uid("combobox-group");
</script>

<div
	role="group"
	aria-labelledby={labelId}
	class={cn(ctx.classes.group, className)}
	data-kind="combobox"
	data-slot="group"
>
	<div
		id={labelId}
		class={ctx.classes.groupLabel}
		data-kind="combobox"
		data-slot="group-label"
	>
		{label}
	</div>
	{@render children?.()}
</div>
