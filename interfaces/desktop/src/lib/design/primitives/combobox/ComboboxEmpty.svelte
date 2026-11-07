<!--
	@component ComboboxEmpty
	@description Structural shell for combobox empty state placeholder.
	Contract: kind="combobox", slot="empty", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ComboboxEmptyProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxEmptyProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ComboboxEmpty");
</script>

<div
	{...rest}
	data-kind="combobox"
	data-slot="empty"
	class={cn(className)}
>
	{@render children?.()}
</div>
