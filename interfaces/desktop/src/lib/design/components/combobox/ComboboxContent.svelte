<!--
	@component Combobox.Content
	@kind combobox
	@slot content
	@layer components

	Listbox popup container. role="listbox" from hook.
	Uses attachListbox Svelte action for dismiss/escape/presence.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxContentProps } from "./types.js";

let { children, class: className }: ComboboxContentProps = $props();
const ctx = getComboboxContext();
</script>

{#if ctx.hook.open}
	<div
		{...ctx.hook.listbox}
		use:ctx.hook.attachListbox
		class={cn(ctx.classes.content, className)}
		data-kind="combobox"
		data-slot="content"
		data-state="open"
	>
		{@render children?.()}
	</div>
{/if}
