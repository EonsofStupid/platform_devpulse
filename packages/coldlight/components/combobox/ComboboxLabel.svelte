<!--
	@component Combobox.Label
	@kind combobox
	@slot label
	@layer components
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxLabelProps } from "./types.js";

let { children, class: className }: ComboboxLabelProps = $props();
const ctx = getComboboxContext();
</script>

<label
	{...ctx.hook.label}
	class={cn(className)}
	data-kind="combobox"
	data-slot="label"
>
	{@render children?.()}
</label>
