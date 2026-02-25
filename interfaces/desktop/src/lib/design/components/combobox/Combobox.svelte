<!--
	@component Combobox
	@kind combobox
	@layer components

	ColdLight Combobox — compound component root.
	Creates MeltUI combobox transport and sets root context.
	Renderless root — children are the input, trigger, and content.

	MeltUI transport adapter provides ARIA.
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
	import type { ComboboxProps } from "./types.js";
	import { createComboboxTransport } from "$lib/design/api/adapters/meltui/_internal/combobox/index.js";
	import { setComboboxContext } from "./context.js";

	let {
		value,
		onValueChange,
		inputValue,
		onInputValueChange,
		open,
		onOpenChange,
		children,
		class: className,
		...rest
	}: ComboboxProps = $props();

	const transport = createComboboxTransport({
		value,
		onValueChange,
		inputValue,
		onInputValueChange,
		open,
		onOpenChange,
	});

	setComboboxContext(transport);
</script>

<div data-kind="combobox" data-slot="root" class={className} {...rest}>
	{@render children?.()}
</div>
