<!--
	@component RadioGroupItem
	@description Structural shell for radio-group item.
	Contract: kind="radio-group", slot="item", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { RadioGroupItemProps } from "./types.js";
	import { getRadioGroupContext, setRadioGroupItemContext } from "./context.js";

	let { value, children, class: className, ...rest }: RadioGroupItemProps = $props();
	const groupCtx = getRadioGroupContext();

	setRadioGroupItemContext({
		get checked() {
			return groupCtx.value === value;
		},
	});

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "RadioGroupItem");
</script>

<button
	{...rest}
	data-kind="radio-group"
	data-slot="item"
	data-state={groupCtx.value === value ? "checked" : undefined}
	class={cn(className)}
>
	{@render children?.()}
</button>
