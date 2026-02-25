<!--
	@component Select
	@kind select
	@layer components

	ColdLight Select — compound component root.
	Creates MeltUI select transport and sets root context.
	Renderless root — children are the trigger and content.

	MeltUI transport adapter provides ARIA.
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
-->
<script lang="ts">
	import type { SelectProps } from "./types.js";
	import { createSelectTransport } from "$lib/design/api/adapters/meltui/_internal/select/index.js";
	import { setSelectContext } from "./context.js";

	let {
		value,
		onValueChange,
		open,
		onOpenChange,
		placeholder,
		children,
		class: className,
		...rest
	}: SelectProps = $props();

	const transport = createSelectTransport({
		value,
		onValueChange,
		open,
		onOpenChange,
	});

	setSelectContext(transport);
</script>

<div data-kind="select" data-slot="root" class={className} {...rest}>
	{@render children?.()}
</div>
