<!--
	@component Combobox.Empty
	@kind combobox
	@slot empty
	@layer components

	No-results state. role="status" aria-live="polite".
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxEmptyProps } from "./types.js";

let { children, class: className }: ComboboxEmptyProps = $props();
const ctx = getComboboxContext();
</script>

<div
	role="status"
	aria-live="polite"
	aria-atomic="true"
	class={cn(ctx.classes.empty, className)}
	data-kind="combobox"
	data-slot="empty"
>
	{@render children?.()}
</div>
